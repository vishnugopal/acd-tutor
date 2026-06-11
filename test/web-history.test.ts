import { describe, expect, test } from "bun:test";
import { toTranscript } from "../src/web/history";

/** Shapes mirror Flue's agent_end `messages` payload (normalized LlmMessages). */
const text = (t: string) => ({ type: "text", text: t });

describe("toTranscript (Flue agent_end → chat transcript)", () => {
  test("maps user and assistant text messages to user/tutor", () => {
    const transcript = toTranscript([
      { role: "user", content: [text("let's start")] },
      { role: "assistant", content: [text("Welcome to lesson 1!")] },
    ]);
    expect(transcript).toEqual([
      { role: "user", text: "let's start" },
      { role: "tutor", text: "Welcome to lesson 1!" },
    ]);
  });

  test("drops tool-call-only assistant turns and toolResult messages", () => {
    const transcript = toTranscript([
      { role: "user", content: [text("go")] },
      {
        role: "assistant",
        content: [{ type: "toolCall", id: "t1", name: "writeFile", arguments: {} }],
      },
      {
        role: "toolResult",
        toolCallId: "t1",
        toolName: "writeFile",
        content: [text("Wrote lesson-1.ts")],
      },
      { role: "assistant", content: [text("Created your first lesson.")] },
    ]);
    expect(transcript).toEqual([
      { role: "user", text: "go" },
      { role: "tutor", text: "Created your first lesson." },
    ]);
  });

  test("joins multiple text segments and skips thinking content", () => {
    const transcript = toTranscript([
      {
        role: "assistant",
        content: [
          { type: "thinking", thinking: "hmm" },
          text("Part one. "),
          text("Part two."),
        ],
      },
    ]);
    expect(transcript).toEqual([{ role: "tutor", text: "Part one. Part two." }]);
  });

  test("accepts plain-string content and ignores malformed entries", () => {
    const transcript = toTranscript([
      { role: "user", content: "plain string" },
      { role: "user" },
      null as unknown as object,
      { role: "system", content: [text("hidden")] },
    ]);
    expect(transcript).toEqual([{ role: "user", text: "plain string" }]);
  });
});
