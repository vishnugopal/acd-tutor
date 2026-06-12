import { describe, expect, test } from "bun:test";
import { parseStreamFrame } from "../../src/shared/chunks";

describe("parseStreamFrame", () => {
  test("parses text and debug chunks", () => {
    expect(parseStreamFrame('{"kind":"text","text":"hi"}')).toEqual({
      kind: "text",
      text: "hi",
    });
    expect(parseStreamFrame('{"kind":"debug","text":"→ readFile(x)"}')).toEqual({
      kind: "debug",
      text: "→ readFile(x)",
    });
  });

  test("parses the terminal frames", () => {
    expect(parseStreamFrame('{"kind":"done"}')).toEqual({ kind: "done" });
    expect(parseStreamFrame('{"kind":"error","text":"boom"}')).toEqual({
      kind: "error",
      text: "boom",
    });
  });

  test("garbage JSON → null (skip, don't crash)", () => {
    expect(parseStreamFrame("not json")).toBeNull();
    expect(parseStreamFrame("")).toBeNull();
    expect(parseStreamFrame("{truncated")).toBeNull();
  });

  test("valid JSON of the wrong shape → null", () => {
    expect(parseStreamFrame("null")).toBeNull();
    expect(parseStreamFrame("42")).toBeNull();
    expect(parseStreamFrame('"text"')).toBeNull();
    expect(parseStreamFrame("{}")).toBeNull();
    expect(parseStreamFrame('{"kind":"jazz"}')).toBeNull();
    expect(parseStreamFrame('{"kind":"text"}')).toBeNull();
    expect(parseStreamFrame('{"kind":"text","text":7}')).toBeNull();
    expect(parseStreamFrame('{"kind":"error","text":null}')).toBeNull();
  });
});
