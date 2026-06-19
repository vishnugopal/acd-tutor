import { Text, useInput } from "ink";
import { useState } from "react";

/** Index of the start of the word before `pos` (readline-style: skip spaces, then the word). */
function wordStart(text: string, pos: number): number {
  let i = pos;
  while (i > 0 && /\s/.test(text[i - 1]!)) i--;
  while (i > 0 && !/\s/.test(text[i - 1]!)) i--;
  return i;
}

/** Index just past the end of the word after `pos`. */
function wordEnd(text: string, pos: number): number {
  let i = pos;
  while (i < text.length && /\s/.test(text[i]!)) i++;
  while (i < text.length && !/\s/.test(text[i]!)) i++;
  return i;
}

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  /** Receive keystrokes and show the cursor. */
  focus?: boolean;
  placeholder?: string;
}

/**
 * Single-line text input with readline-style editing:
 * ctrl+a/e (line start/end), ctrl+b/f (char move), alt+b/f and alt/ctrl+arrows
 * (word move), ctrl+w / alt+backspace (delete word back), alt+d (delete word
 * forward), ctrl+u (kill to start), ctrl+k (kill to end), ctrl+d (delete char).
 */
export function TextInput({
  value,
  onChange,
  onSubmit,
  focus = true,
  placeholder = "",
}: TextInputProps) {
  // Clamp instead of syncing: when the parent clears the value, the stale
  // cursor position collapses to the new end of line.
  const [rawCursor, setRawCursor] = useState(value.length);
  const cursor = Math.min(rawCursor, value.length);

  const edit = (next: string, nextCursor: number) => {
    onChange(next);
    setRawCursor(nextCursor);
  };

  useInput(
    (input, key) => {
      if (key.return) {
        onSubmit?.(value);
        return;
      }
      if (key.tab || key.escape) return; // tab is handled by the focus manager
      if (key.upArrow || key.downArrow || key.pageUp || key.pageDown) return;

      // Arrow keys: plain = char move, alt/ctrl-modified = word move.
      const byWord = key.meta || key.ctrl;
      if (key.leftArrow) {
        setRawCursor(
          byWord ? wordStart(value, cursor) : Math.max(0, cursor - 1),
        );
        return;
      }
      if (key.rightArrow) {
        setRawCursor(
          byWord ? wordEnd(value, cursor) : Math.min(value.length, cursor + 1),
        );
        return;
      }

      if (key.ctrl) {
        switch (input) {
          case "a":
            setRawCursor(0);
            return;
          case "e":
            setRawCursor(value.length);
            return;
          case "b":
            setRawCursor(Math.max(0, cursor - 1));
            return;
          case "f":
            setRawCursor(Math.min(value.length, cursor + 1));
            return;
          case "w": {
            const start = wordStart(value, cursor);
            edit(value.slice(0, start) + value.slice(cursor), start);
            return;
          }
          case "u":
            edit(value.slice(cursor), 0);
            return;
          case "k":
            edit(value.slice(0, cursor), cursor);
            return;
          case "d":
            if (cursor < value.length)
              edit(value.slice(0, cursor) + value.slice(cursor + 1), cursor);
            return;
          default:
            return; // swallow unhandled ctrl chords
        }
      }

      if (key.meta) {
        if (key.backspace || key.delete) {
          const start = wordStart(value, cursor);
          edit(value.slice(0, start) + value.slice(cursor), start);
          return;
        }
        switch (input) {
          case "b":
            setRawCursor(wordStart(value, cursor));
            return;
          case "f":
            setRawCursor(wordEnd(value, cursor));
            return;
          case "d": {
            const end = wordEnd(value, cursor);
            edit(value.slice(0, cursor) + value.slice(end), cursor);
            return;
          }
          default:
            return;
        }
      }

      // Many terminals report Backspace as `delete`; treat both as backspace.
      if (key.backspace || key.delete) {
        if (cursor > 0)
          edit(value.slice(0, cursor - 1) + value.slice(cursor), cursor - 1);
        return;
      }

      if (input) {
        edit(
          value.slice(0, cursor) + input + value.slice(cursor),
          cursor + input.length,
        );
      }
    },
    { isActive: focus },
  );

  if (!focus) return <Text>{value}</Text>;

  if (!value) {
    return (
      <Text>
        <Text inverse> </Text>
        <Text dimColor>{placeholder}</Text>
      </Text>
    );
  }

  const before = value.slice(0, cursor);
  const at = cursor < value.length ? value[cursor] : " ";
  const after = cursor < value.length ? value.slice(cursor + 1) : "";
  return (
    <Text>
      {before}
      <Text inverse>{at}</Text>
      {after}
    </Text>
  );
}

/** Test-only access to module-private pure helpers. Undefined outside `bun test`. */
export const __test__ =
  process.env.NODE_ENV === "test" ? { wordStart, wordEnd } : undefined;
