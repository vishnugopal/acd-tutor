import { Box, Static, Text } from "ink";
import { Markdown } from "./Markdown";
import type { Message } from "../types";

const textOf = (message: Message): string => message.text ?? "";

function MessageView({ message }: { message: Message }) {
  switch (message.role) {
    case "user":
      return (
        <Box marginBottom={1}>
          <Text color="cyan">{"› "}</Text>
          <Text color="cyan">{textOf(message)}</Text>
        </Box>
      );
    case "error":
      return (
        <Box marginBottom={1}>
          <Text color="red">{textOf(message)}</Text>
        </Box>
      );
    case "info":
      return (
        <Box marginBottom={1}>
          <Text dimColor>{textOf(message)}</Text>
        </Box>
      );
    case "debug":
      // No bottom margin so consecutive diagnostic lines stack tightly.
      return (
        <Box>
          <Text color="yellow" dimColor>
            {textOf(message)}
          </Text>
        </Box>
      );
    case "diagram": {
      const diagram = message.diagram;
      if (!diagram) return null;
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold>{diagram.title}</Text>
          <Text dimColor>{diagram.caption}</Text>
          <Text>{diagram.terminal ?? diagram.mermaid}</Text>
          <Text dimColor>{diagram.altText}</Text>
        </Box>
      );
    }
    default:
      return (
        <Box marginBottom={1}>
          <Markdown>{textOf(message)}</Markdown>
        </Box>
      );
  }
}

export interface TranscriptProps {
  /** Completed entries; rendered once via <Static> so they scroll naturally. */
  messages: Message[];
  /** In-flight tutor reply; `""` means waiting for the first chunk, `null` means idle. */
  streamingText: string | null;
  /** Lines submitted while a reply was streaming, waiting to be sent. */
  queued: string[];
}

/** Conversation history plus the live (still streaming) reply. */
export function Transcript({ messages, streamingText, queued }: TranscriptProps) {
  return (
    <>
      <Static items={messages}>
        {(message, index) => <MessageView key={index} message={message} />}
      </Static>
      {!!streamingText && (
        <Box marginBottom={1}>
          <Markdown>{streamingText}</Markdown>
        </Box>
      )}
      {queued.map((line, index) => (
        <Box key={index}>
          <Text dimColor>{`(queued) › ${line}`}</Text>
        </Box>
      ))}
    </>
  );
}
