import type { DirectAgentPayload, FlueClient } from "@flue/sdk";

export interface AgentSession {
  /** Conversation id — memory lives server-side on this for the session's lifetime. */
  instanceId: string;
  /** Invokes the agent once and yields the reply's text chunks as they stream in. */
  send(payload: DirectAgentPayload): AsyncIterable<string>;
}

/**
 * Pins an agent + conversation instance over @flue/sdk's streaming HTTP
 * invoke (SSE under the hood). Transport-only: rendering and prompting stay
 * with the caller.
 */
export function createAgentSession(
  client: FlueClient,
  agent: string,
  instanceId: string = `${agent}_${crypto.randomUUID()}`,
): AgentSession {
  return {
    instanceId,
    async *send(payload: DirectAgentPayload): AsyncIterable<string> {
      const stream = client.agents.invoke(agent, instanceId, {
        mode: "stream",
        payload,
      });
      for await (const event of stream) {
        if (event.type === "text_delta") yield event.text;
      }
    },
  };
}
