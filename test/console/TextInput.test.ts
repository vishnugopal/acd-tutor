import { describe, expect, test } from "bun:test";
import { __test__ } from "../../src/console/TextInput";

const { wordStart, wordEnd } = __test__!;

describe("wordStart", () => {
  test("from end of a single word jumps to its start", () => {
    expect(wordStart("hello", 5)).toBe(0);
  });

  test("from inside a word jumps to that word's start", () => {
    expect(wordStart("foo bar baz", 9)).toBe(8); // inside "baz"
  });

  test("skips trailing whitespace then the preceding word", () => {
    expect(wordStart("foo bar   ", 10)).toBe(4); // past spaces, back over "bar"
  });

  test("at the very start stays at 0", () => {
    expect(wordStart("hello", 0)).toBe(0);
  });

  test("collapses multiple spaces between words", () => {
    expect(wordStart("foo    bar", 7)).toBe(0); // pos at "bar" start, skip spaces + "foo"
  });

  test("handles the empty string", () => {
    expect(wordStart("", 0)).toBe(0);
  });

  test("handles a single char", () => {
    expect(wordStart("x", 1)).toBe(0);
  });
});

describe("wordEnd", () => {
  test("from start of a single word jumps past its end", () => {
    expect(wordEnd("hello", 0)).toBe(5);
  });

  test("from inside a word jumps just past that word", () => {
    expect(wordEnd("foo bar baz", 4)).toBe(7); // start of "bar" → end of "bar"
  });

  test("skips leading whitespace then the next word", () => {
    expect(wordEnd("   foo", 0)).toBe(6); // past spaces, over "foo"
  });

  test("at the very end stays at length", () => {
    expect(wordEnd("hello", 5)).toBe(5);
  });

  test("collapses multiple spaces between words", () => {
    expect(wordEnd("foo    bar", 3)).toBe(10); // from end of "foo", skip spaces + "bar"
  });

  test("handles the empty string", () => {
    expect(wordEnd("", 0)).toBe(0);
  });

  test("handles a single char", () => {
    expect(wordEnd("x", 0)).toBe(1);
  });
});
