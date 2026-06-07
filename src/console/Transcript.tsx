import { Box, Static, Text } from "ink";
import { Markdown } from "./Markdown";
import type { Message } from "./types";

function MessageView({ message }: { message: Message }) {
  switch (message.role) {
    case "user":
      return (
        <Box marginBottom={1}>
          <Text color="cyan">{"› "}</Text>
          <Text color="cyan">{message.text}</Text>
        </Box>
      );
    case "error":
      return (
        <Box marginBottom={1}>
          <Text color="red">{message.text}</Text>
        </Box>
      );
    case "info":
      return (
        <Box marginBottom={1}>
          <Text dimColor>{message.text}</Text>
        </Box>
      );
    case "debug":
      // No bottom margin so consecutive diagnostic lines stack tightly.
      return (
        <Box>
          <Text color="yellow" dimColor>
            {message.text}
          </Text>
        </Box>
      );
    default:
      return (
        <Box marginBottom={1}>
          <Markdown>{message.text}</Markdown>
        </Box>
      );
  }
}

export interface TranscriptProps {
  /** Completed entries; rendered once via <Static> so they scroll naturally. */
  messages: Message[];
  /** In-flight tutor reply; `""` means waiting for the first chunk, `null` means idle. */
  streamingText: string | null;
  thinkingIndicator: string;
}

/** Conversation history plus the live (still streaming) reply. */
export function Transcript({
  messages,
  streamingText,
  thinkingIndicator,
}: TranscriptProps) {
  return (
    <>
      <Static items={messages}>
        {(message, index) => <MessageView key={index} message={message} />}
      </Static>
      {streamingText !== null && (
        <Box marginBottom={1}>
          {streamingText === "" ? (
            <Text dimColor>{thinkingIndicator}</Text>
          ) : (
            <Markdown>{streamingText}</Markdown>
          )}
        </Box>
      )}
    </>
  );
}
