import { useEffect, useRef, useState } from "react";
import {
  finishStream,
  foldChunk,
  initialStreamState,
} from "../shared/stream-fold";
import type { Message, ReplyChunk } from "./types";

/**
 * The send loop behind the console chat, split per the project style:
 * foldChunk/finishStream (src/shared/stream-fold.ts) are calculations over
 * the in-flight reply, and the useChatStream hook is the thin action shell
 * that runs them against React state (transcript, streaming line, FIFO
 * queue).
 */

export interface ChatStreamOptions {
  reply: (line: string) => AsyncIterable<ReplyChunk>;
  greeting?: string;
  emptyReplyMessage: string;
  formatError: (err: unknown) => string;
  /** Read mid-stream, so /debug toggles apply to the reply in flight. */
  debugMode: boolean;
}

export interface ChatStream {
  messages: Message[];
  /** null = idle; "" = waiting for the first chunk; text = streaming in. */
  streamingText: string | null;
  /** Lines waiting behind the in-flight reply, in submission order. */
  queued: string[];
  busy: boolean;
  /** Queues a line for the agent (FIFO — nothing is dropped while busy). */
  submit: (line: string) => void;
  /** Appends an info line to the transcript (e.g. slash-command feedback). */
  appendInfo: (text: string) => void;
}

export function useChatStream({
  reply,
  greeting,
  emptyReplyMessage,
  formatError,
  debugMode,
}: ChatStreamOptions): ChatStream {
  const [messages, setMessages] = useState<Message[]>(() =>
    greeting === undefined ? [] : [{ role: "info", text: greeting }],
  );
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [queued, setQueued] = useState<string[]>([]);
  const debugModeRef = useRef(debugMode);
  debugModeRef.current = debugMode;
  const busy = streamingText !== null;

  const append = (...entries: Message[]) => {
    if (entries.length > 0) setMessages((prev) => [...prev, ...entries]);
  };

  const send = async (line: string) => {
    append({ role: "user", text: line });
    setStreamingText(""); // "" renders the thinking indicator
    let state = initialStreamState;
    try {
      for await (const chunk of reply(line)) {
        const folded = foldChunk(state, chunk, debugModeRef.current);
        state = folded.state;
        append(...folded.append);
        setStreamingText(state.text);
      }
      append(...finishStream(state, emptyReplyMessage));
    } catch (err) {
      append({ role: "error", text: formatError(err) });
    } finally {
      setStreamingText(null);
    }
  };

  // Pump: send the next queued line as soon as the current reply finishes.
  // All input goes through the queue, so messages submitted while the agent
  // is responding are delivered in order instead of being dropped.
  useEffect(() => {
    if (busy || queued.length === 0) return;
    const [next, ...rest] = queued;
    setQueued(rest);
    void send(next!);
  }, [busy, queued]);

  return {
    messages,
    streamingText,
    queued,
    busy,
    submit: (line) => setQueued((prev) => [...prev, line]),
    appendInfo: (text) => append({ role: "info", text }),
  };
}
