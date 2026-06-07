import { Box, useApp } from "ink";
import { useEffect, useRef, useState } from "react";
import { InputBar } from "./InputBar";
import { Transcript } from "./Transcript";
import type { ConsoleAction, Message, ReplyChunk } from "./types";
import type { AgentChunk } from "../agent-io";

/**
 * Adapter between what the agent layer yields and what the console renders.
 * Identity for now; the seam exists so display formatting can evolve without
 * touching the agent layer.
 */
function formatAgentChunkToReplyChunk(chunk: AgentChunk): ReplyChunk {
  return chunk;
}

export interface AppProps {
  reply: (line: string) => AsyncIterable<ReplyChunk>;
  greeting?: string;
  emptyReplyMessage: string;
  thinkingIndicator: string;
  formatError: (err: unknown) => string;
  actions: ConsoleAction[];
}

/**
 * Chat UI: transcript on top, action buttons + input area pinned below.
 * Generic: the reply source is whatever `reply` yields.
 */
export function App({
  reply,
  greeting,
  emptyReplyMessage,
  thinkingIndicator,
  formatError,
  actions,
}: AppProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>(() =>
    greeting === undefined ? [] : [{ role: "info", text: greeting }],
  );
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [queued, setQueued] = useState<string[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  // Read inside the streaming loop so /debug toggles apply mid-reply.
  const debugModeRef = useRef(debugMode);
  const busy = streamingText !== null;

  const append = (message: Message) =>
    setMessages((prev) => [...prev, message]);

  const send = async (line: string) => {
    append({ role: "user", text: line });
    setStreamingText(""); // "" renders the thinking indicator
    let text = "";
    let replied = false;
    // Moves the accumulated prose into the transcript so a debug line can
    // land after it in chronological order (e.g. a tool call mid-reply).
    const flushText = () => {
      if (!text) return;
      append({ role: "tutor", text });
      replied = true;
      text = "";
      setStreamingText("");
    };
    try {
      for await (const raw of reply(line)) {
        const chunk = formatAgentChunkToReplyChunk(raw);
        if (chunk.kind === "debug") {
          if (!debugModeRef.current) continue;
          flushText();
          append({ role: "debug", text: chunk.text });
          continue;
        }
        text += chunk.text;
        setStreamingText(text);
      }
      if (text) append({ role: "tutor", text });
      else if (!replied) append({ role: "info", text: emptyReplyMessage });
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

  // Slash commands act immediately, even while a reply is streaming;
  // everything else is queued.
  const handleSubmit = (line: string) => {
    if (line === "/exit") {
      exit();
      return;
    }
    if (line === "/debug") {
      const next = !debugMode;
      setDebugMode(next);
      debugModeRef.current = next;
      append({ role: "info", text: `Debug mode ${next ? "on" : "off"}.` });
      return;
    }
    setQueued((prev) => [...prev, line]);
  };

  return (
    <Box flexDirection="column">
      <Transcript
        messages={messages}
        streamingText={streamingText}
        queued={queued}
        thinkingIndicator={thinkingIndicator}
      />
      <InputBar
        actions={actions}
        onSubmit={handleSubmit}
        onAction={(action) => handleSubmit(action.message)}
      />
    </Box>
  );
}
