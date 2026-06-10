import { describe, expect, test } from "bun:test";
import type { FlueClient, FlueEvent } from "@flue/sdk";
import { __test__, createAgentSession, type AgentChunk } from "../src/agent-io";
import * as ev from "./fixtures/faux-events";

const { truncate, formatDebugEvent } = __test__!;

describe("truncate", () => {
  test("passes short strings through unchanged", () => {
    expect(truncate("hello")).toBe("hello");
  });

  test("slices long strings to 120 chars and appends an ellipsis", () => {
    const long = "a".repeat(200);
    const out = truncate(long);
    expect(out).toBe(`${"a".repeat(120)}…`);
    expect(out).toHaveLength(121); // 120 chars + the ellipsis
  });

  test("keeps a string exactly at the limit untouched", () => {
    const exact = "b".repeat(120);
    expect(truncate(exact)).toBe(exact);
  });

  test("JSON-stringifies non-string values", () => {
    expect(truncate({ a: 1 })).toBe('{"a":1}');
    expect(truncate([1, 2])).toBe("[1,2]");
    expect(truncate(42)).toBe("42");
  });

  test("returns empty string for values JSON.stringify drops", () => {
    expect(truncate(undefined)).toBe("");
    expect(truncate(() => {})).toBe("");
  });
});

describe("formatDebugEvent", () => {
  test("tool_start renders the call with truncated args", () => {
    expect(formatDebugEvent(ev.toolStart("readFile", { filename: "x.ts" }))).toBe(
      '→ readFile({"filename":"x.ts"})',
    );
  });

  test("tool_call renders ok and ERROR variants with duration", () => {
    expect(
      formatDebugEvent(
        ev.toolCall({ toolName: "writeFile", result: "Wrote x.ts", durationMs: 8 }),
      ),
    ).toBe("← writeFile ok in 8ms: Wrote x.ts");
    expect(
      formatDebugEvent(
        ev.toolCall({ toolName: "writeFile", isError: true, result: "boom", durationMs: 3 }),
      ),
    ).toBe("← writeFile ERROR in 3ms: boom");
  });

  test("thinking_end reports the content length", () => {
    expect(formatDebugEvent(ev.thinkingEnd("hello"))).toBe("thinking (5 chars)");
  });

  test("turn renders model, stop reason, tokens and duration", () => {
    expect(
      formatDebugEvent(
        ev.turn({
          model: "claude",
          stopReason: "end_turn",
          durationMs: 100,
          usage: ev.usage(10, 20),
        }),
      ),
    ).toBe("turn claude stop=end_turn tokens=10/20 cache=0r/0w in 100ms");
  });

  test("turn omits the tokens segment when usage is absent", () => {
    expect(formatDebugEvent(ev.turn({ model: "claude", stopReason: "end_turn", durationMs: 50 }))).toBe(
      "turn claude stop=end_turn in 50ms",
    );
  });

  test("turn falls back to ? for missing model/stopReason and appends errors", () => {
    expect(
      formatDebugEvent(ev.turn({ durationMs: 9, isError: true, error: "kaput" })),
    ).toBe("turn ? stop=? in 9ms ERROR: kaput");
  });

  test("log renders level and message", () => {
    expect(formatDebugEvent(ev.log("warn", "heads up"))).toBe("[warn] heads up");
  });

  test("compaction renders the message-count transition", () => {
    expect(
      formatDebugEvent(ev.compaction({ messagesBefore: 20, messagesAfter: 5, durationMs: 30 })),
    ).toBe("compaction 20→5 msgs in 30ms");
  });

  test("task_start renders the truncated prompt", () => {
    expect(formatDebugEvent(ev.taskStart("k1", "do a thing"))).toBe(
      "task k1 started: do a thing",
    );
  });

  test("task renders done and ERROR variants", () => {
    expect(formatDebugEvent(ev.task({ taskId: "k1", result: "yay" }))).toBe(
      "task k1 done: yay",
    );
    expect(formatDebugEvent(ev.task({ taskId: "k1", isError: true, result: "nope" }))).toBe(
      "task k1 ERROR: nope",
    );
  });

  test("run_end renders only on error, otherwise null", () => {
    expect(formatDebugEvent(ev.runEnd({ isError: true, error: "fatal" }))).toBe(
      "run ERROR: fatal",
    );
    expect(formatDebugEvent(ev.runEnd())).toBeNull();
  });

  test("returns null for noise events", () => {
    expect(formatDebugEvent(ev.noiseEvent())).toBeNull();
  });
});

/** Builds a fake FlueClient whose agent invoke replays the given events. */
function fakeClient(events: FlueEvent[]): {
  client: FlueClient;
  calls: { agent: string; id: string }[];
} {
  const calls: { agent: string; id: string }[] = [];
  const client = {
    agents: {
      invoke(agent: string, id: string) {
        calls.push({ agent, id });
        return (async function* () {
          for (const event of events) yield event;
        })();
      },
    },
  } as unknown as FlueClient;
  return { client, calls };
}

async function collect(stream: AsyncIterable<AgentChunk>): Promise<AgentChunk[]> {
  const out: AgentChunk[] = [];
  for await (const chunk of stream) out.push(chunk);
  return out;
}

describe("createAgentSession", () => {
  test("yields text_delta as text chunks and other events as debug chunks", async () => {
    const { client } = fakeClient([
      ev.textDelta("Hel"),
      ev.toolStart("readFile", { filename: "x.ts" }),
      ev.textDelta("lo"),
    ]);
    const session = createAgentSession(client, "main");
    const chunks = await collect(session.send({ message: "hi" }));
    expect(chunks).toEqual([
      { kind: "text", text: "Hel" },
      { kind: "debug", text: '→ readFile({"filename":"x.ts"})' },
      { kind: "text", text: "lo" },
    ]);
  });

  test("drops events that format to null", async () => {
    const { client } = fakeClient([ev.noiseEvent(), ev.textDelta("ok"), ev.runEnd()]);
    const session = createAgentSession(client, "main");
    const chunks = await collect(session.send({ message: "hi" }));
    expect(chunks).toEqual([{ kind: "text", text: "ok" }]);
  });

  test("defaults instanceId to `${agent}_<uuid>`", () => {
    const { client } = fakeClient([]);
    const session = createAgentSession(client, "main");
    expect(session.instanceId).toMatch(/^main_[0-9a-f-]{36}$/);
  });

  test("honors an explicit instanceId and passes it to invoke", async () => {
    const { client, calls } = fakeClient([ev.textDelta("hi")]);
    const session = createAgentSession(client, "main", "main_fixed");
    expect(session.instanceId).toBe("main_fixed");
    await collect(session.send({ message: "hi" }));
    expect(calls).toEqual([{ agent: "main", id: "main_fixed" }]);
  });
});
