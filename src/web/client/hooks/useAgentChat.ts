import { useCallback, useEffect, useRef, useState } from "react";
import { createSession, fetchHistory, streamReply } from "../api";
import {
  clearConversationId,
  loadConversationId,
  saveConversationId,
} from "../lib/storage";
import type { ChatMessage } from "../types";

/**
 * Live agent conversation over the web API — the browser counterpart of the
 * console runner's send loop (src/console/App.tsx): text chunks accumulate
 * into a streaming bubble, debug chunks are dropped (logged to devtools), and
 * the reply lands in the transcript when the stream ends.
 *
 * The conversation id is persisted in localStorage so a reload resumes the
 * same Flue conversation; the transcript itself is restored from the server
 * (Flue's history snapshot), never duplicated client-side.
 */

const EMPTY_REPLY_MESSAGE = "(The tutor had nothing to say.)";
const ERROR_MESSAGE =
  "⚠️ Oops — I had trouble reaching your tutor. Check your connection and try sending that again!";

interface Options {
  agentId: string;
  /** Shown as the tutor's first message (client-side, like the console). */
  greeting?: string;
  /** Runs after each completed reply — e.g. refresh lesson files. */
  onReplyDone?: () => void;
}

export interface AgentChat {
  messages: ChatMessage[];
  /** null = idle; "" = waiting for first chunk; text = reply streaming in. */
  streamingText: string | null;
  isBusy: boolean;
  /**
   * Sends `text` to the agent. `display` (e.g. an action button's label)
   * replaces the raw prompt in the transcript when provided.
   */
  send: (text: string, display?: string) => void;
  /** Drops the stored conversation and starts over from the greeting. */
  reset: () => void;
}

let nextId = 1;
const msg = (role: ChatMessage["role"], text: string): ChatMessage => ({
  id: nextId++,
  role,
  text,
});

export function useAgentChat({
  agentId,
  greeting,
  onReplyDone,
}: Options): AgentChat {
  const greetingMessages = useCallback(
    () => (greeting ? [msg("tutor", greeting.trim())] : []),
    [greeting],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(greetingMessages);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const busyRef = useRef(false);
  const sessionRef = useRef<Promise<string> | null>(null);

  // Keep the latest callback without re-creating `send`.
  const onReplyDoneRef = useRef(onReplyDone);
  onReplyDoneRef.current = onReplyDone;

  const append = (message: ChatMessage) =>
    setMessages((prev) => [...prev, message]);

  /** One session per conversation id; resumes the stored one when present. */
  const ensureSession = useCallback(() => {
    sessionRef.current ??= createSession(
      agentId,
      loadConversationId(agentId) ?? undefined,
    ).then((id) => {
      saveConversationId(agentId, id);
      return id;
    });
    return sessionRef.current;
  }, [agentId]);

  // Restore a prior conversation on mount: re-open the session under the
  // stored id and replay the transcript Flue last emitted for it.
  useEffect(() => {
    const stored = loadConversationId(agentId);
    if (!stored) return;
    let cancelled = false;
    void ensureSession();
    fetchHistory(stored)
      .then((history) => {
        if (cancelled || history.length === 0) return;
        setMessages((prev) => [
          ...prev,
          ...history.map((m) => msg(m.role, m.text)),
        ]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [agentId, ensureSession]);

  const send = useCallback(
    (text: string, display?: string) => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current) return;
      busyRef.current = true;

      append(msg("user", display ?? trimmed));
      setStreamingText("");

      void (async () => {
        try {
          const sessionId = await ensureSession();

          let reply = "";
          for await (const chunk of streamReply(sessionId, trimmed)) {
            if (chunk.kind === "text") {
              reply += chunk.text;
              setStreamingText(reply);
            } else {
              console.debug("[tutor]", chunk.text);
            }
          }
          append(msg("tutor", reply.trim() || EMPTY_REPLY_MESSAGE));
          onReplyDoneRef.current?.();
        } catch (err) {
          console.error("[tutor] reply failed", err);
          append(msg("info", ERROR_MESSAGE));
        } finally {
          busyRef.current = false;
          setStreamingText(null);
        }
      })();
    },
    [ensureSession],
  );

  const reset = useCallback(() => {
    if (busyRef.current) return;
    clearConversationId(agentId);
    sessionRef.current = null;
    setMessages(greetingMessages());
  }, [agentId, greetingMessages]);

  return {
    messages,
    streamingText,
    isBusy: streamingText !== null,
    send,
    reset,
  };
}
