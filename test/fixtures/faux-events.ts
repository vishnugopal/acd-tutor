import type { FlueEvent } from "@flue/sdk";

/** The usage shape carried on a `turn` event — derived so we don't depend on the unexported PromptUsage. */
type PromptUsage = NonNullable<Extract<FlueEvent, { type: "turn" }>["usage"]>;

/**
 * Builders for synthetic FlueEvents. These keep the agent-io tests focused on
 * the fields formatDebugEvent/createAgentSession actually read, with the rest
 * filled in just enough to satisfy the type.
 */

export function textDelta(text: string): FlueEvent {
  return { type: "text_delta", text };
}

export function toolStart(toolName: string, args?: unknown): FlueEvent {
  return { type: "tool_start", toolName, toolCallId: "tc_1", args };
}

export function toolCall(opts: {
  toolName: string;
  isError?: boolean;
  result?: unknown;
  durationMs?: number;
}): FlueEvent {
  return {
    type: "tool_call",
    toolName: opts.toolName,
    toolCallId: "tc_1",
    isError: opts.isError ?? false,
    result: opts.result,
    durationMs: opts.durationMs ?? 5,
  };
}

export function thinkingEnd(content: string): FlueEvent {
  return { type: "thinking_end", content };
}

export function usage(input: number, output: number): PromptUsage {
  return {
    input,
    output,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: input + output,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

export function turn(opts: {
  model?: string;
  stopReason?: string;
  durationMs?: number;
  usage?: PromptUsage;
  isError?: boolean;
  error?: unknown;
}): FlueEvent {
  return {
    type: "turn",
    turnId: "t_1",
    purpose: "prompt" as never,
    durationMs: opts.durationMs ?? 10,
    model: opts.model,
    usage: opts.usage,
    stopReason: opts.stopReason,
    isError: opts.isError ?? false,
    error: opts.error,
  };
}

export function log(level: "info" | "warn" | "error", message: string): FlueEvent {
  return { type: "log", level, message };
}

export function compaction(opts: {
  messagesBefore: number;
  messagesAfter: number;
  durationMs?: number;
}): FlueEvent {
  return {
    type: "compaction",
    messagesBefore: opts.messagesBefore,
    messagesAfter: opts.messagesAfter,
    durationMs: opts.durationMs ?? 7,
  };
}

export function taskStart(taskId: string, prompt: string): FlueEvent {
  return { type: "task_start", taskId, prompt };
}

export function task(opts: {
  taskId: string;
  isError?: boolean;
  result?: unknown;
  durationMs?: number;
}): FlueEvent {
  return {
    type: "task",
    taskId: opts.taskId,
    isError: opts.isError ?? false,
    result: opts.result,
    durationMs: opts.durationMs ?? 12,
  };
}

export function runEnd(opts: { isError?: boolean; error?: unknown } = {}): FlueEvent {
  return {
    type: "run_end",
    runId: "r_1",
    isError: opts.isError ?? false,
    error: opts.error,
    durationMs: 20,
  };
}

/** An event formatDebugEvent treats as noise (returns null for). */
export function noiseEvent(): FlueEvent {
  return { type: "idle" };
}
