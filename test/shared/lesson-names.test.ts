import { describe, expect, test } from "bun:test";
import {
  courseProgress,
  isHiddenFile,
  latestLessonFile,
  lessonNumber,
  sortLessonFiles,
} from "../../src/shared/lesson-names";

describe("isHiddenFile", () => {
  test("dotfiles are hidden, lesson files are not", () => {
    expect(isHiddenFile(".open-request")).toBe(true);
    expect(isHiddenFile(".DS_Store")).toBe(true);
    expect(isHiddenFile("lesson-1.ts")).toBe(false);
  });
});

describe("lessonNumber", () => {
  test("extracts the first number, null when absent", () => {
    expect(lessonNumber("lesson-3.ts")).toBe(3);
    expect(lessonNumber("notes.md")).toBeNull();
  });
});

describe("sortLessonFiles", () => {
  test("numbered lessons numerically, then the rest alphabetically", () => {
    expect(
      sortLessonFiles(["notes.md", "lesson-10.ts", "lesson-2.ts", "a.md"]),
    ).toEqual(["lesson-2.ts", "lesson-10.ts", "a.md", "notes.md"]);
  });

  test("does not mutate its input", () => {
    const files = ["lesson-2.ts", "lesson-1.ts"];
    sortLessonFiles(files);
    expect(files).toEqual(["lesson-2.ts", "lesson-1.ts"]);
  });
});

describe("latestLessonFile", () => {
  test("the highest-numbered lesson", () => {
    expect(latestLessonFile(["lesson-1.ts", "lesson-3.ts", "lesson-2.ts"])).toBe(
      "lesson-3.ts",
    );
  });

  test("null for an empty workspace", () => {
    expect(latestLessonFile([])).toBeNull();
  });
});

describe("courseProgress", () => {
  test("highest-numbered file is current; everything below is done", () => {
    expect(courseProgress(["lesson-1.ts", "lesson-3.ts"])).toEqual({
      current: 3,
      done: [1, 2],
    });
  });

  test("no numbered files → lesson 1, nothing done", () => {
    expect(courseProgress([])).toEqual({ current: 1, done: [] });
    expect(courseProgress(["notes.md"])).toEqual({ current: 1, done: [] });
  });
});
