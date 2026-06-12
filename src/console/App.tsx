import { Box, useApp } from "ink";
import { useState } from "react";
import { InputBar } from "./InputBar";
import { Transcript } from "./Transcript";
import { useChatStream } from "./useChatStream";
import type { ConsoleAction, ReplyChunk } from "./types";

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
 * Generic: the reply source is whatever `reply` yields. Streaming and the
 * input queue live in useChatStream; this component owns slash-command
 * dispatch and layout.
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
  const [debugMode, setDebugMode] = useState(false);
  const stream = useChatStream({
    reply,
    greeting,
    emptyReplyMessage,
    formatError,
    debugMode,
  });

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
      stream.appendInfo(`Debug mode ${next ? "on" : "off"}.`);
      return;
    }
    stream.submit(line);
  };

  return (
    <Box flexDirection="column">
      <Transcript
        messages={stream.messages}
        streamingText={stream.streamingText}
        queued={stream.queued}
      />
      <InputBar
        actions={actions}
        busy={stream.busy}
        thinkingIndicator={thinkingIndicator}
        onSubmit={handleSubmit}
        onAction={(action) => handleSubmit(action.message)}
      />
    </Box>
  );
}
