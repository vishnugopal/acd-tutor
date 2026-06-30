/**
 * The send queue as pure data + calculations. The useAgentChat hook
 * (hooks/useAgentChat.ts) drives it: messages submitted while a reply is
 * streaming are appended here instead of being dropped, then pumped one at a
 * time as the agent frees up — the browser counterpart of the console's FIFO
 * queue (src/console/hooks/useChatStream.ts). Keeping the shape and the
 * enqueue/dequeue decisions here makes them testable without a browser.
 */

/** A user message waiting behind the in-flight reply (shown grayed-out). */
export interface QueuedMessage {
  /** Stable key for React lists. */
  id: number;
  /** The prompt sent to the agent, already trimmed. */
  text: string;
  /** What the transcript shows — an action's label, or the text itself. */
  display: string;
}

/**
 * Build a queued message, or null when the text is blank (nothing to send).
 * `display` falls back to the trimmed text (action buttons pass their label).
 */
export function queueMessage(
  id: number,
  text: string,
  display?: string,
): QueuedMessage | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return { id, text: trimmed, display: display ?? trimmed };
}

/**
 * Split the head off the queue for sending, or null when it's empty. The rest
 * stays in submission order so delivery is strictly FIFO.
 */
export function takeNext(
  queue: readonly QueuedMessage[],
): { next: QueuedMessage; rest: QueuedMessage[] } | null {
  if (queue.length === 0) return null;
  const [next, ...rest] = queue;
  return { next: next!, rest };
}
