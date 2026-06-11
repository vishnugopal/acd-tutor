/**
 * Maps Flue's normalized conversation messages to the simple transcript the
 * chat UI renders.
 *
 * Important: Flue's `agent_end` event carries only the *current run's* new
 * messages (this turn's prompt + reply) — NOT the full conversation. So the
 * web server accumulates each turn's transcript across replies (see
 * {@link appendTurn}) rather than treating any single `agent_end` payload as
 * the whole history.
 */

export interface TranscriptMessage {
  role: "user" | "tutor";
  text: string;
}

interface ContentItem {
  type?: string;
  text?: string;
}

interface NormalizedMessage {
  role?: string;
  content?: ContentItem[] | string;
}

export function toTranscript(messages: unknown[]): TranscriptMessage[] {
  const transcript: TranscriptMessage[] = [];
  for (const raw of messages) {
    if (raw === null || typeof raw !== "object") continue;
    const message = raw as NormalizedMessage;
    if (message.role !== "user" && message.role !== "assistant") continue;

    const { content } = message;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .filter((c) => c?.type === "text" && typeof c.text === "string")
              .map((c) => c.text)
              .join("")
          : "";

    const trimmed = text.trim();
    if (!trimmed) continue; // tool-call-only assistant turns have no prose

    transcript.push({
      role: message.role === "user" ? "user" : "tutor",
      text: trimmed,
    });
  }
  return transcript;
}

/**
 * Appends one `agent_end` turn's messages to the running transcript.
 *
 * Each `agent_end` only reports the new messages from that run, so history is
 * built by accumulating turns — not overwriting. A turn that maps to nothing
 * (e.g. Flue's error/abort path emits a single empty assistant message) leaves
 * the existing transcript untouched, so a dropped stream never wipes history.
 */
export function appendTurn(
  existing: TranscriptMessage[],
  messages: unknown[],
): TranscriptMessage[] {
  const turn = toTranscript(messages);
  return turn.length === 0 ? existing : [...existing, ...turn];
}
