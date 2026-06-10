import { Box, Text, useInput } from "ink";
import { useState } from "react";
import type { AgentChoice } from "./types";

export interface MenuProps {
  /** The selectable agents (≥1). */
  choices: AgentChoice[];
  /** Called with the chosen agent when the user presses Enter. */
  onSelect: (choice: AgentChoice) => void;
  /** Heading above the list. */
  prompt?: string;
}

/**
 * Generic arrow-key selection list. Knows nothing about agents beyond the
 * label/description on each choice — ↑/↓ to move, Enter to pick.
 */
export function Menu({
  choices,
  onSelect,
  prompt = "Which tutor would you like?",
}: MenuProps) {
  const [index, setIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) setIndex((i) => (i - 1 + choices.length) % choices.length);
    else if (key.downArrow) setIndex((i) => (i + 1) % choices.length);
    else if (key.return) onSelect(choices[index]!);
  });

  return (
    <Box flexDirection="column" paddingY={1}>
      <Text bold>{prompt}</Text>
      <Box flexDirection="column" marginTop={1}>
        {choices.map((choice, i) => {
          const active = i === index;
          return (
            <Box key={choice.id}>
              <Text color={active ? "cyan" : undefined} bold={active}>
                {active ? "› " : "  "}
                {choice.label}
              </Text>
              {choice.description && (
                <Text dimColor> — {choice.description}</Text>
              )}
            </Box>
          );
        })}
      </Box>
      <Text dimColor> ↑/↓ to move · enter to select · ctrl+c to quit</Text>
    </Box>
  );
}
