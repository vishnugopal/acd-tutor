import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";

/**
 * Drives a canned tutor conversation: every user message advances through
 * `script` after a typing delay (the script holds on its last entry). The
 * lesson screen can also push ad-hoc tutor messages (e.g. check hints).
 * Later, `send` is where a real agent-session call plugs in.
 */

const TYPING_DELAY_MS = 900;

export interface StepHelpers {
  /** Push an extra tutor message (e.g. a diagram) right after a script step. */
  pushTutorMessage: (text: string, kind?: ChatMessage["kind"]) => void;
}

interface Options {
  opening: string;
  script: string[];
  /** Called after the tutor's reply for script step `index` lands. */
  onStep?: (index: number, helpers: StepHelpers) => void;
  /** Called once, when the final script entry has been delivered. */
  onScriptEnd?: (helpers: StepHelpers) => void;
}

export interface ScriptedChat {
  messages: ChatMessage[];
  isTyping: boolean;
  send: (text: string) => void;
  /** Push a tutor message outside the script (still shows the typing delay). */
  pushTutorMessage: (text: string, kind?: ChatMessage["kind"]) => void;
}

let nextId = 1;
const msg = (
  role: ChatMessage["role"],
  text: string,
  kind: ChatMessage["kind"] = "text",
): ChatMessage => ({ id: nextId++, role, text, kind });

export function useScriptedChat({
  opening,
  script,
  onStep,
  onScriptEnd,
}: Options): ScriptedChat {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    msg("tutor", opening),
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const stepRef = useRef(0);
  const endedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const delay = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  const pushTutorMessage = useCallback(
    (text: string, kind: ChatMessage["kind"] = "text") => {
      setIsTyping(true);
      delay(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, msg("tutor", text, kind)]);
      }, TYPING_DELAY_MS);
    },
    [delay],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      setMessages((prev) => [...prev, msg("user", trimmed)]);

      const index = Math.min(stepRef.current, script.length - 1);
      setIsTyping(true);
      delay(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, msg("tutor", script[index]!)]);
        const helpers = { pushTutorMessage };
        onStep?.(index, helpers);
        if (index === script.length - 1 && !endedRef.current) {
          endedRef.current = true;
          onScriptEnd?.(helpers);
        }
      }, TYPING_DELAY_MS);

      if (stepRef.current < script.length - 1) stepRef.current += 1;
    },
    [delay, isTyping, onScriptEnd, onStep, pushTutorMessage, script],
  );

  return { messages, isTyping, send, pushTutorMessage };
}
