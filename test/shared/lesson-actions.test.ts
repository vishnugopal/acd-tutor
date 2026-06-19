import { describe, expect, test } from "bun:test";
import {
  lessonChatActions,
  START_LESSON_ACTION,
} from "../../src/shared/lesson-actions";

describe("lessonChatActions", () => {
  const check = {
    label: "Check my work",
    message: "Please check my work.",
  };

  test("empty workspace exposes Start and sends the start message", () => {
    expect(lessonChatActions([], [check])).toEqual([START_LESSON_ACTION]);
  });

  test("lesson files present expose the agent's normal actions", () => {
    expect(lessonChatActions(["lesson-1.ts"], [check])).toEqual([check]);
  });

  test("lesson files present with no agent actions exposes no actions", () => {
    expect(lessonChatActions(["lesson-1.ts"], undefined)).toEqual([]);
  });
});
