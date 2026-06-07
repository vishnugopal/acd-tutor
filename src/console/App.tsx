import { Box, useApp } from "ink";
import { useState } from "react";
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
  const [debugMode, setDebugMode] = useState(false);
  const busy = streamingText !== null;

  const append = (message: Message) =>
    setMessages((prev) => [...prev, message]);

  const send = async (line: string) => {
    if (busy) return;
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
          if (!debugMode) continue;
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

  const handleSubmit = (line: string) => {
    if (line === "/exit") {
      exit();
      return;
    }
    if (line === "/debug") {
      const next = !debugMode;
      setDebugMode(next);
      append({ role: "info", text: `Debug mode ${next ? "on" : "off"}.` });
      return;
    }
    void send(line);
  };

  return (
    <Box flexDirection="column">
      <Transcript
        messages={messages}
        streamingText={streamingText}
        thinkingIndicator={thinkingIndicator}
      />
      <InputBar
        busy={busy}
        actions={actions}
        onSubmit={handleSubmit}
        onAction={(action) => void send(action.message)}
      />
    </Box>
  );
}
