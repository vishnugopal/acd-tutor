import type { LineSpec } from "../types";

export type Mark = "A" | "ok" | null;

export interface LineResult {
  spec: LineSpec;
  mark: Mark;
  correct: boolean;
}

export interface CheckOutcome {
  results: LineResult[];
  correctCount: number;
  total: number;
  perfect: boolean;
  /** Tutor hint to show when the check is not perfect. */
  hint: string | null;
}

/** Reads the student's mark from a single source line. */
export function markOf(line: string): Mark {
  if (/\/\/\s*ok\b/i.test(line)) return "ok";
  if (/\/\/\s*A\b/i.test(line)) return "A";
  return null;
}

function lineFor(code: string, spec: LineSpec): string {
  return code.split("\n").find((l) => l.includes(spec.key)) ?? "";
}

/** How many of the classifiable lines carry any mark yet (drives the status bar). */
export function countMarked(code: string, specs: LineSpec[]): number {
  return specs.filter((spec) => markOf(lineFor(code, spec)) !== null).length;
}

/** Grades the student's code against the lesson's line specs. */
export function checkCode(code: string, specs: LineSpec[]): CheckOutcome {
  const results: LineResult[] = specs.map((spec) => {
    const mark = markOf(lineFor(code, spec));
    return { spec, mark, correct: mark === spec.expect };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const perfect = correctCount === results.length;

  return {
    results,
    correctCount,
    total: results.length,
    perfect,
    hint: perfect ? null : buildHint(results),
  };
}

/**
 * Picks the tutor's next Socratic nudge: a targeted question when a pure line
 * was marked as an action, otherwise a progress recap + the repeat-call test.
 */
function buildHint(results: LineResult[]): string {
  const falseAction = results.find((r) => !r.spec.isAction && r.mark === "A");
  if (falseAction?.spec.hint) return falseAction.spec.hint;

  const actionsTotal = results.filter((r) => r.spec.isAction).length;
  const actionsFound = results.filter(
    (r) => r.spec.isAction && r.mark === "A",
  ).length;
  return `You found ${actionsFound} of ${actionsTotal} actions… try the repeat-call test: if you ran this twice, would anything differ?`;
}
