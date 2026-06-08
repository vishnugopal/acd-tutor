import { Box, Text, useFocus, useFocusManager, useInput } from "ink";
import { useState } from "react";
import { Spinner } from "./Spinner";
import { TextInput } from "./TextInput";
import type { ConsoleAction } from "./types";

const PROMPT_INPUT_ID = "prompt-input";

function ActionButton({
  action,
  onPress,
}: {
  action: ConsoleAction;
  onPress: () => void;
}) {
  const { isFocused } = useFocus();
  useInput(
    (_input, key) => {
      if (key.return) onPress();
    },
    { isActive: isFocused },
  );
  return (
    <Box
      borderStyle="round"
      borderColor={isFocused ? "cyan" : "gray"}
      paddingX={1}
    >
      <Text color={isFocused ? "cyan" : undefined} bold={isFocused}>
        {action.label}
      </Text>
    </Box>
  );
}

function PromptInput({ onSubmit }: { onSubmit: (line: string) => void }) {
  const { isFocused } = useFocus({ autoFocus: true, id: PROMPT_INPUT_ID });
  const [value, setValue] = useState("");
  const submit = (line: string) => {
    if (!line.trim()) return;
    setValue("");
    onSubmit(line.trim());
  };
  return (
    <Box
      borderStyle="round"
      borderColor={isFocused ? "cyan" : "gray"}
      paddingX={1}
    >
      <Text color="cyan">{"> "}</Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={submit}
        focus={isFocused}
        placeholder={isFocused ? "Type a message…" : ""}
      />
    </Box>
  );
}

export interface InputBarProps {
  actions: ConsoleAction[];
  /** True while a reply is in flight (thinking, running tools, or streaming). */
  busy: boolean;
  thinkingIndicator: string;
  onSubmit: (line: string) => void;
  onAction: (action: ConsoleAction) => void;
}

/** Action buttons plus the bordered typing area, pinned below the transcript. */
export function InputBar({
  actions,
  busy,
  thinkingIndicator,
  onSubmit,
  onAction,
}: InputBarProps) {
  const { focus } = useFocusManager();
  // Pressing a button hands focus back to the input so typing can resume.
  const pressAction = (action: ConsoleAction) => {
    onAction(action);
    focus(PROMPT_INPUT_ID);
  };

  // Ctrl+G presses the first action button without tabbing over to it.
  // (Ctrl+K is left to the input's readline kill-to-end-of-line binding.)
  useInput(
    (input, key) => {
      if (key.ctrl && input === "g" && actions[0]) pressAction(actions[0]);
    },
    { isActive: actions.length > 0 },
  );

  return (
    <Box flexDirection="column">
      {busy && (
        <Box>
          <Spinner label={thinkingIndicator} />
        </Box>
      )}
      {actions.length > 0 && (
        <Box alignItems="center">
          {actions.map((action) => (
            <ActionButton
              key={action.label}
              action={action}
              onPress={() => pressAction(action)}
            />
          ))}
          <Text dimColor> ctrl+g · tab to focus, enter to press</Text>
        </Box>
      )}
      <PromptInput onSubmit={onSubmit} />
      <Text dimColor> /exit or ctrl+c to quit · /debug toggles debug</Text>
    </Box>
  );
}
