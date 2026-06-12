import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { streamReply } from "../../../src/web/client/api";
import type { ReplyChunk } from "../../../src/web/client/types";

/**
 * streamReply against a mocked fetch: the SSE wire format is crafted by hand
 * so the parser's edge cases (malformed frames, heartbeats, missing done)
 * are exercised without a server.
 */

const realFetch = globalThis.fetch;
let lastInit: RequestInit | undefined;

function mockSse(raw: string): void {
  globalThis.fetch = ((_input: unknown, init?: RequestInit) => {
    lastInit = init;
    return Promise.resolve(
      new Response(raw, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );
  }) as typeof fetch;
}

async function collect(): Promise<ReplyChunk[]> {
  const chunks: ReplyChunk[] = [];
  for await (const chunk of streamReply("s1", "hi")) chunks.push(chunk);
  return chunks;
}

beforeEach(() => {
  lastInit = undefined;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("streamReply", () => {
  test("happy path: yields chunks and terminates on done", async () => {
    mockSse(
      'data: {"kind":"text","text":"Hel"}\n\n' +
        'data: {"kind":"debug","text":"→ tool()"}\n\n' +
        'data: {"kind":"text","text":"lo"}\n\n' +
        'data: {"kind":"done"}\n\n',
    );
    expect(await collect()).toEqual([
      { kind: "text", text: "Hel" },
      { kind: "debug", text: "→ tool()" },
      { kind: "text", text: "lo" },
    ]);
  });

  test("keepalive comments are ignored", async () => {
    mockSse(
      ": keepalive\n\n" +
        'data: {"kind":"text","text":"hi"}\n\n' +
        ": keepalive\n\n" +
        'data: {"kind":"done"}\n\n',
    );
    expect(await collect()).toEqual([{ kind: "text", text: "hi" }]);
  });

  test("a malformed frame is skipped, not fatal", async () => {
    mockSse(
      "data: {oops\n\n" +
        'data: {"kind":"text","text":"still here"}\n\n' +
        'data: {"kind":"done"}\n\n',
    );
    expect(await collect()).toEqual([{ kind: "text", text: "still here" }]);
  });

  test("an error frame becomes a thrown Error", async () => {
    mockSse(
      'data: {"kind":"text","text":"part"}\n\n' +
        'data: {"kind":"error","text":"boom"}\n\n',
    );
    expect(collect()).rejects.toThrow("boom");
  });

  test("a stream that ends without done throws (truncated ≠ complete)", async () => {
    mockSse('data: {"kind":"text","text":"trunc"}\n\n');
    expect(collect()).rejects.toThrow(
      "Connection dropped before the reply finished",
    );
  });

  test("a non-OK response throws", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(new Response("nope", { status: 404 }))) as unknown as typeof fetch;
    expect(collect()).rejects.toThrow("Send failed (404)");
  });

  test("forwards the AbortSignal to fetch", async () => {
    mockSse('data: {"kind":"done"}\n\n');
    const controller = new AbortController();
    for await (const _ of streamReply("s1", "hi", controller.signal)) {
      // drain
    }
    expect(lastInit?.signal).toBe(controller.signal);
  });
});
