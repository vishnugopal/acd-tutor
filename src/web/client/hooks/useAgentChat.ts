import { useCallback, useEffect, useRef, useState } from "react";
import {
  finishStream,
  foldChunk,
  initialStreamState,
} from "../../../shared/stream-fold";
import { createSession, fetchHistory, streamReply } from "../api";
import {
  clearConversationId,
  loadConversationId,
  saveConversationId,
} from "../lib/storage";
import type { ChatMessage } from "../types";

/**
 * Live agent conversation over the web API — the browser counterpart of the
 * console runner's send loop (src/console/App.tsx): chunks fold through the
 * shared stream-fold calculations, so debug lines render in the transcript
 * when debug mode is on (the options-menu counterpart of the console's
 * /debug) and fold away otherwise.
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
  /** When on, agent diagnostics render in the transcript as debug lines. */
  debugMode: boolean;
  /** Safe to call mid-stream — applies to the reply in flight. */
  toggleDebug: () => void;
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
  const [debugMode, setDebugMode] = useState(false);
  const debugModeRef = useRef(debugMode);
  debugModeRef.current = debugMode;
  const toggleDebug = useCallback(() => setDebugMode((v) => !v), []);
  const busyRef = useRef(false);
  const sessionRef = useRef<Promise<string> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel the in-flight reply when the screen unmounts (e.g. back to home) —
  // otherwise the fetch keeps streaming in the background.
  useEffect(() => () => abortRef.current?.abort(), []);

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
      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        try {
          const sessionId = await ensureSession();

          let state = initialStreamState;
          for await (const chunk of streamReply(
            sessionId,
            trimmed,
            controller.signal,
          )) {
            if (chunk.kind === "debug") console.debug("[tutor]", chunk.text);
            const folded = foldChunk(state, chunk, debugModeRef.current);
            state = folded.state;
            if (folded.append.length > 0) {
              setMessages((prev) => [
                ...prev,
                ...folded.append.map((m) => msg(m.role, m.text)),
              ]);
            }
            setStreamingText(state.text);
          }
          // Trimmed so whitespace-only prose still yields the empty-reply
          // message, as before the fold.
          for (const m of finishStream(
            { ...state, text: state.text.trim() },
            EMPTY_REPLY_MESSAGE,
          )) {
            append(msg(m.role, m.text));
          }
          onReplyDoneRef.current?.();
        } catch (err) {
          // A deliberate cancel (unmount) isn't an error to render. A dropped
          // connection is: the error bubble, never a truncated reply.
          if (!controller.signal.aborted) {
            console.error("[tutor] reply failed", err);
            append(msg("info", ERROR_MESSAGE));
          }
        } finally {
          if (abortRef.current === controller) abortRef.current = null;
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
    debugMode,
    toggleDebug,
  };
}
