/**
 * Maps Flue's normalized conversation messages (the `agent_end` event's
 * `messages` payload) to the simple transcript the chat UI renders. Flue is
 * the source of truth for history — the web server only keeps its latest
 * emitted snapshot per conversation, nothing is reconstructed client-side.
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
