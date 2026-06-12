import { describe, expect, test } from "bun:test";
import { nextSaveState } from "../../../src/web/client/lib/autosave";

describe("nextSaveState", () => {
  test("edit → unsaved (from anywhere)", () => {
    expect(nextSaveState("idle", { type: "edited" })).toBe("unsaved");
    expect(nextSaveState("saved", { type: "edited" })).toBe("unsaved");
    expect(nextSaveState("error", { type: "edited" })).toBe("unsaved");
  });

  test("save lifecycle: unsaved → saving → saved", () => {
    expect(nextSaveState("unsaved", { type: "save-started" })).toBe("saving");
    expect(
      nextSaveState("saving", { type: "saved", editedMeanwhile: false }),
    ).toBe("saved");
  });

  test("save ok but edited meanwhile → back to unsaved, not saved", () => {
    expect(
      nextSaveState("saving", { type: "saved", editedMeanwhile: true }),
    ).toBe("unsaved");
  });

  test("save failure → error", () => {
    expect(nextSaveState("saving", { type: "save-failed" })).toBe("error");
  });

  test("opening a file (or resetting the baseline) → idle", () => {
    expect(nextSaveState("error", { type: "opened" })).toBe("idle");
    expect(nextSaveState("saved", { type: "opened" })).toBe("idle");
  });
});
