import { describe, expect, test } from "bun:test";
import {
  finishStream,
  foldChunk,
  initialStreamState,
} from "../../src/shared/stream-fold";

describe("foldChunk", () => {
  test("text chunks accumulate without touching the transcript", () => {
    const first = foldChunk(initialStreamState, { kind: "text", text: "Hel" }, false);
    expect(first.append).toEqual([]);
    const second = foldChunk(first.state, { kind: "text", text: "lo" }, false);
    expect(second.state.text).toBe("Hello");
    expect(second.append).toEqual([]);
  });

  test("hidden debug chunks fold away entirely", () => {
    const state = { text: "partial", replied: false };
    const folded = foldChunk(state, { kind: "debug", text: "→ tool()" }, false);
    expect(folded.state).toBe(state);
    expect(folded.append).toEqual([]);
  });

  test("visible debug with no prose appends only the debug line", () => {
    const folded = foldChunk(
      initialStreamState,
      { kind: "debug", text: "→ tool()" },
      true,
    );
    expect(folded.append).toEqual([{ role: "debug", text: "→ tool()" }]);
    expect(folded.state.replied).toBe(false);
  });

  test("visible debug flushes accumulated prose first (chronological order)", () => {
    const folded = foldChunk(
      { text: "so far", replied: false },
      { kind: "debug", text: "→ tool()" },
      true,
    );
    expect(folded.append).toEqual([
      { role: "tutor", text: "so far" },
      { role: "debug", text: "→ tool()" },
    ]);
    expect(folded.state).toEqual({ text: "", replied: true });
  });
});

describe("finishStream", () => {
  test("remaining prose becomes the tutor reply", () => {
    expect(finishStream({ text: "Done!", replied: false }, "(nothing)")).toEqual([
      { role: "tutor", text: "Done!" },
    ]);
  });

  test("no prose at all → the empty-reply message", () => {
    expect(finishStream(initialStreamState, "(nothing)")).toEqual([
      { role: "info", text: "(nothing)" },
    ]);
  });

  test("prose already flushed mid-reply → nothing more to append", () => {
    expect(finishStream({ text: "", replied: true }, "(nothing)")).toEqual([]);
  });

  // Callers that want "(nothing)" for whitespace-only prose trim before
  // calling (the web hook does); finishStream itself treats any non-empty
  // string as prose.
  test("whitespace-only prose, trimmed by the caller → the empty-reply message", () => {
    expect(finishStream({ text: "  \n ".trim(), replied: false }, "(nothing)")).toEqual([
      { role: "info", text: "(nothing)" },
    ]);
  });
});
