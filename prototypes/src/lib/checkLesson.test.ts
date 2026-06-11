import { describe, expect, test } from "bun:test";
import { ACD_LESSON } from "../data/acdLesson";
import { checkCode, countMarked, markOf } from "./checkLesson";

const { initialCode, lines } = ACD_LESSON;

function markAllCorrect(code: string): string {
  return code
    .split("\n")
    .map((l) => {
      if (/Math\.random|Date\.now|sessionCount \+ 1|console\.log/.test(l))
        return l.replace("// ?", "// A");
      if (/const session = |return session/.test(l))
        return l.replace("// ?", "// ok");
      return l;
    })
    .join("\n");
}

describe("markOf", () => {
  test("reads marks case-insensitively", () => {
    expect(markOf("x; // A")).toBe("A");
    expect(markOf("x; // a")).toBe("A");
    expect(markOf("x; // ok")).toBe("ok");
    expect(markOf("x; // OK")).toBe("ok");
    expect(markOf("x; // ?")).toBeNull();
    expect(markOf("x;")).toBeNull();
  });

  test("does not confuse ok with A", () => {
    expect(markOf("const a = 1; // ok")).toBe("ok");
  });
});

describe("checkCode", () => {
  test("unmarked code scores 0 and hints at the repeat-call test", () => {
    const outcome = checkCode(initialCode, lines);
    expect(outcome.correctCount).toBe(0);
    expect(outcome.perfect).toBe(false);
    expect(outcome.hint).toContain("0 of 4 actions");
  });

  test("fully correct code is perfect", () => {
    const outcome = checkCode(markAllCorrect(initialCode), lines);
    expect(outcome.correctCount).toBe(6);
    expect(outcome.perfect).toBe(true);
    expect(outcome.hint).toBeNull();
  });

  test("the sessionId line does not shadow the session object line", () => {
    // "const sessionId = Math.random()..." contains "const session" as a
    // substring — the spec key "const session =" must match the right line.
    const code = initialCode
      .split("\n")
      .map((l) =>
        /const session = /.test(l) ? l.replace("// ?", "// ok") : l,
      )
      .join("\n");
    const outcome = checkCode(code, lines);
    const objLine = outcome.results.find((r) => r.spec.key === "const session =")!;
    expect(objLine.mark).toBe("ok");
    expect(objLine.correct).toBe(true);
  });

  test("marking a pure line as an action surfaces its targeted hint", () => {
    const code = initialCode
      .split("\n")
      .map((l) =>
        /const session = /.test(l) ? l.replace("// ?", "// A") : l,
      )
      .join("\n");
    const outcome = checkCode(code, lines);
    expect(outcome.perfect).toBe(false);
    expect(outcome.hint).toContain("userId, sessionId, createdAt");
  });
});

describe("countMarked", () => {
  test("counts only lines that carry a mark", () => {
    expect(countMarked(initialCode, lines)).toBe(0);
    expect(countMarked(markAllCorrect(initialCode), lines)).toBe(6);
    const half = initialCode.replace("// ?", "// A");
    expect(countMarked(half, lines)).toBe(1);
  });
});
