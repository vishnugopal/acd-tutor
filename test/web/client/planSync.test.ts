import { describe, expect, test } from "bun:test";
import { planSync } from "../../../src/web/client/hooks/useLessonFileSync";

/**
 * Decision table pinning the file-sync behavior the screen had before the
 * extraction: open-request wins → first file → newer-and-clean →
 * tutor-rewrote-current.
 */
describe("planSync", () => {
  const FILES = ["lesson-1.ts", "lesson-2.ts"];

  describe("open-request wins", () => {
    test("a valid request for another file opens it — even mid-edit", () => {
      for (const dirty of [false, true]) {
        expect(
          planSync({ files: FILES, openRequest: "lesson-1.ts", active: "lesson-2.ts", dirty }),
        ).toEqual({
          kind: "open",
          file: "lesson-1.ts",
          toast: "📂 Beep opened lesson-1.ts for you",
        });
      }
    });

    test("a request for the already-active file falls through", () => {
      expect(
        planSync({ files: FILES, openRequest: "lesson-2.ts", active: "lesson-2.ts", dirty: true }),
      ).toEqual({ kind: "none" });
    });

    test("a request for a file not in the workspace falls through", () => {
      expect(
        planSync({ files: FILES, openRequest: "ghost.ts", active: "lesson-2.ts", dirty: true }),
      ).toEqual({ kind: "none" });
    });
  });

  describe("first file", () => {
    test("empty workspace → nothing to do", () => {
      expect(
        planSync({ files: [], openRequest: null, active: null, dirty: false }),
      ).toEqual({ kind: "none" });
    });

    test("nothing open yet → open the newest lesson", () => {
      expect(
        planSync({ files: FILES, openRequest: null, active: null, dirty: false }),
      ).toEqual({
        kind: "open",
        file: "lesson-2.ts",
        toast: "📂 lesson-2.ts is ready!",
      });
    });
  });

  describe("newer lesson appeared", () => {
    test("clean editor → switch to it", () => {
      expect(
        planSync({ files: FILES, openRequest: null, active: "lesson-1.ts", dirty: false }),
      ).toEqual({
        kind: "open",
        file: "lesson-2.ts",
        toast: "📂 lesson-2.ts unlocked!",
      });
    });

    test("mid-edit → announce, don't yank", () => {
      expect(
        planSync({ files: FILES, openRequest: null, active: "lesson-1.ts", dirty: true }),
      ).toEqual({ kind: "toast", toast: "📂 New lesson ready: lesson-2.ts" });
    });

    test("an unnumbered newest file never counts as newer", () => {
      expect(
        planSync({
          files: ["lesson-2.ts", "notes.md"],
          openRequest: null,
          active: "lesson-2.ts",
          dirty: false,
        }),
      ).toEqual({ kind: "refresh", file: "lesson-2.ts" });
    });
  });

  describe("same lesson", () => {
    test("clean editor → re-read it (the tutor may have rewritten it)", () => {
      expect(
        planSync({ files: FILES, openRequest: null, active: "lesson-2.ts", dirty: false }),
      ).toEqual({ kind: "refresh", file: "lesson-2.ts" });
    });

    test("mid-edit → leave the editor alone", () => {
      expect(
        planSync({ files: FILES, openRequest: null, active: "lesson-2.ts", dirty: true }),
      ).toEqual({ kind: "none" });
    });
  });
});
