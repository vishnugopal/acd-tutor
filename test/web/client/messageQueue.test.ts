import { describe, expect, test } from "bun:test";
import {
  queueMessage,
  takeNext,
  type QueuedMessage,
} from "../../../src/web/client/lib/messageQueue";

describe("queueMessage", () => {
  test("trims the text and defaults display to it", () => {
    expect(queueMessage(1, "  hello  ")).toEqual({
      id: 1,
      text: "hello",
      display: "hello",
    });
  });

  test("keeps a distinct display (e.g. an action button label)", () => {
    expect(queueMessage(7, "check please", "Check my work")).toEqual({
      id: 7,
      text: "check please",
      display: "Check my work",
    });
  });

  test("rejects blank / whitespace-only text", () => {
    expect(queueMessage(1, "")).toBeNull();
    expect(queueMessage(1, "   \n\t ")).toBeNull();
  });
});

describe("takeNext", () => {
  test("returns null on an empty queue", () => {
    expect(takeNext([])).toBeNull();
  });

  test("splits the head off, preserving FIFO order for the rest", () => {
    const queue: QueuedMessage[] = [
      { id: 1, text: "one", display: "one" },
      { id: 2, text: "two", display: "two" },
      { id: 3, text: "three", display: "three" },
    ];
    const taken = takeNext(queue);
    expect(taken?.next.text).toBe("one");
    expect(taken?.rest.map((m) => m.text)).toEqual(["two", "three"]);
  });

  test("does not mutate the input queue", () => {
    const queue: QueuedMessage[] = [{ id: 1, text: "one", display: "one" }];
    takeNext(queue);
    expect(queue).toHaveLength(1);
  });
});
