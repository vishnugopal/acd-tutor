import { describe, expect, test } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { App, type AppProps } from "../../src/console/App";
import type { ReplyChunk } from "../../src/console/types";

const ENTER = "\r";

/** Lets a queued render/stream settle before we assert on the frame. */
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

/**
 * Types a line and submits it. The tick between typing and ENTER lets the
 * controlled input re-render with the new value, so submit reads it (not the
 * stale empty value) — without it, the keystroke and the return are processed
 * in the same synchronous batch before React flushes.
 */
async function submit(stdin: { write: (data: string) => void }, line: string) {
  stdin.write(line);
  await tick(5);
  stdin.write(ENTER);
  await tick();
}

/** A reply that yields the given chunks (optionally after a delay). */
function scriptedReply(
  chunks: (line: string) => ReplyChunk[],
  delayMs = 0,
): AppProps["reply"] {
  return (line) =>
    (async function* () {
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      for (const c of chunks(line)) yield c;
    })();
}

function renderApp(overrides: Partial<AppProps> = {}) {
  const props: AppProps = {
    reply: scriptedReply((line) => [{ kind: "text", text: `Echo: ${line}` }]),
    greeting: "Welcome!",
    emptyReplyMessage: "(nothing)",
    thinkingIndicator: "thinking…",
    formatError: (err) => `[error] ${err instanceof Error ? err.message : String(err)}`,
    actions: [],
    ...overrides,
  };
  return render(<App {...props} />);
}

describe("App", () => {
  test("renders the greeting on start", () => {
    const { lastFrame } = renderApp();
    expect(lastFrame()).toContain("Welcome!");
  });

  test("submitting a line streams a tutor reply into the transcript", async () => {
    const { stdin, lastFrame } = renderApp();
    await submit(stdin, "hello");
    const frame = lastFrame()!;
    expect(frame).toContain("hello"); // echoed user message
    expect(frame).toContain("Echo: hello"); // tutor reply
  });

  test("empty reply shows the empty-reply message", async () => {
    const { stdin, lastFrame } = renderApp({
      reply: scriptedReply(() => []),
    });
    await submit(stdin, "anything");
    expect(lastFrame()).toContain("(nothing)");
  });

  test("debug chunks are hidden until /debug turns them on", async () => {
    const { stdin, lastFrame } = renderApp({
      reply: scriptedReply((line) => [
        { kind: "debug", text: "→ readFile(x)" },
        { kind: "text", text: `Echo: ${line}` },
      ]),
    });

    // Debug off by default: the debug line must not appear.
    await submit(stdin, "first");
    expect(lastFrame()).not.toContain("→ readFile(x)");

    // Toggle debug on.
    await submit(stdin, "/debug");
    expect(lastFrame()).toContain("Debug mode on.");

    // Now debug lines surface.
    await submit(stdin, "second");
    expect(lastFrame()).toContain("→ readFile(x)");
  });

  test("a thrown reply renders an error message", async () => {
    const { stdin, lastFrame } = renderApp({
      reply: () =>
        (async function* () {
          throw new Error("boom");
        })(),
    });
    await submit(stdin, "trigger");
    expect(lastFrame()).toContain("[error] boom");
  });

  test("messages submitted while busy are delivered in FIFO order", async () => {
    // Slow replies so the second submission lands while the first is in flight.
    const { stdin, lastFrame } = renderApp({
      reply: scriptedReply((line) => [{ kind: "text", text: `Echo: ${line}` }], 40),
    });
    await submit(stdin, "one"); // first reply (40ms) still in flight after this
    await submit(stdin, "two"); // lands while busy → queued behind "one"
    await tick(150); // let both drain

    const frame = lastFrame()!;
    const idxOne = frame.indexOf("Echo: one");
    const idxTwo = frame.indexOf("Echo: two");
    expect(idxOne).toBeGreaterThanOrEqual(0);
    expect(idxTwo).toBeGreaterThan(idxOne); // "one" replied before "two"
  });
});
