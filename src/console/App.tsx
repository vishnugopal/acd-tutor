import { Box, useApp } from "ink";
import { useState } from "react";
import { InputBar } from "./InputBar";
import { Transcript } from "./Transcript";
import type { ConsoleAction, Message } from "./types";

export interface AppProps {
  reply: (line: string) => AsyncIterable<string>;
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
  const busy = streamingText !== null;

  const append = (message: Message) =>
    setMessages((prev) => [...prev, message]);

  const send = async (line: string) => {
    if (busy) return;
    append({ role: "user", text: line });
    setStreamingText(""); // "" renders the thinking indicator
    let text = "";
    try {
      for await (const chunk of reply(line)) {
        text += chunk;
        setStreamingText(text);
      }
      append(
        text
          ? { role: "tutor", text }
          : { role: "info", text: emptyReplyMessage },
      );
    } catch (err) {
      append({ role: "error", text: formatError(err) });
    } finally {
      setStreamingText(null);
    }
  };

  const handleSubmit = (line: string) => {
    if (line === "exit" || line === "quit") {
      exit();
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
