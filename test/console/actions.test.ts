import { describe, expect, test } from "bun:test";
import { resolveConsoleActions } from "../../src/console/actions";

describe("resolveConsoleActions", () => {
  const check = {
    label: "Check my work",
    message: "Please check my work.",
  };

  test("workbook agents expose Start while their workspace is empty", async () => {
    const actions = await resolveConsoleActions(
      { id: "acd-tutor", actions: [check] },
      async () => [],
    );
    expect(actions).toEqual([{ label: "Start", message: "start" }]);
  });

  test("workbook agents fall back to normal actions once files exist", async () => {
    const actions = await resolveConsoleActions(
      { id: "acd-tutor", actions: [check] },
      async () => ["lesson-1.ts"],
    );
    expect(actions).toEqual([check]);
  });

  test("chat-only agents keep their catalog actions", async () => {
    const actions = await resolveConsoleActions(
      { id: "socratic-tutor", actions: [] },
      async () => [],
    );
    expect(actions).toEqual([]);
  });

  test("unknown agents keep injected actions", async () => {
    const custom = [{ label: "Demo", message: "demo" }];
    const actions = await resolveConsoleActions(
      { id: "faux-tutor", actions: custom },
      async () => [],
    );
    expect(actions).toEqual(custom);
  });
});
