import type { DirectAgentPayload, FlueClient, FlueEvent } from "@flue/sdk";

/** One streamed chunk of an agent reply. */
export type AgentChunk =
  /** Reply prose, streamed as deltas. */
  | { kind: "text"; text: string }
  /** One formatted diagnostic line (tool calls, turns, logs, …). */
  | { kind: "debug"; text: string };

export interface AgentSession {
  /** Conversation id — memory lives server-side on this for the session's lifetime. */
  instanceId: string;
  /** Invokes the agent once and yields the reply's chunks as they stream in. */
  send(payload: DirectAgentPayload): AsyncIterable<AgentChunk>;
}

export interface AgentSessionHooks {
  /**
   * Observes every raw Flue event before chunk formatting — e.g. the web
   * server captures `agent_end` conversation snapshots for history replay.
   */
  onEvent?: (event: FlueEvent) => void;
}

const TRUNCATE_AT = 120;

function truncate(value: unknown): string {
  const text =
    typeof value === "string" ? value : (JSON.stringify(value) ?? "");
  return text.length > TRUNCATE_AT ? `${text.slice(0, TRUNCATE_AT)}…` : text;
}

/**
 * Renders one Flue event as a concise diagnostic line, or null for events
 * that are noise (message bookkeeping, deltas — text deltas are the reply
 * itself and are yielded as `text` chunks instead).
 */
function formatDebugEvent(event: FlueEvent): string | null {
  switch (event.type) {
    case "tool_start":
      return `→ ${event.toolName}(${truncate(event.args)})`;
    case "tool_call":
      return `← ${event.toolName} ${event.isError ? "ERROR" : "ok"} in ${event.durationMs}ms: ${truncate(event.result)}`;
    case "thinking_end":
      return `thinking (${event.content.length} chars)`;
    case "turn": {
      const tokens = event.usage
        ? ` tokens=${event.usage.input}/${event.usage.output} cache=${event.usage.cacheRead}r/${event.usage.cacheWrite}w`
        : "";
      const error = event.isError ? ` ERROR: ${truncate(event.error)}` : "";
      return `turn ${event.model ?? "?"} stop=${event.stopReason ?? "?"}${tokens} in ${event.durationMs}ms${error}`;
    }
    case "log":
      return `[${event.level}] ${event.message}`;
    case "compaction":
      return `compaction ${event.messagesBefore}→${event.messagesAfter} msgs in ${event.durationMs}ms`;
    case "task_start":
      return `task ${event.taskId} started: ${truncate(event.prompt)}`;
    case "task":
      return `task ${event.taskId} ${event.isError ? "ERROR" : "done"}: ${truncate(event.result)}`;
    case "run_end":
      return event.isError ? `run ERROR: ${truncate(event.error)}` : null;
    default:
      return null;
  }
}

/**
 * Pins an agent + conversation instance over @flue/sdk's streaming HTTP
 * invoke (SSE under the hood). Transport-only: rendering and prompting stay
 * with the caller — debug chunks are always emitted; filtering them is the
 * caller's choice.
 */
export function createAgentSession(
  client: FlueClient,
  agent: string,
  instanceId: string = `${agent}_${crypto.randomUUID()}`,
  hooks?: AgentSessionHooks,
): AgentSession {
  return {
    instanceId,
    async *send(payload: DirectAgentPayload): AsyncIterable<AgentChunk> {
      const stream = client.agents.invoke(agent, instanceId, {
        mode: "stream",
        payload,
      });
      for await (const event of stream) {
        hooks?.onEvent?.(event);
        if (event.type === "text_delta") {
          yield { kind: "text", text: event.text };
          continue;
        }
        const line = formatDebugEvent(event);
        if (line !== null) yield { kind: "debug", text: line };
      }
    },
  };
}

/** Test-only access to module-private pure helpers. Undefined outside `bun test`. */
export const __test__ =
  process.env.NODE_ENV === "test" ? { truncate, formatDebugEvent } : undefined;
