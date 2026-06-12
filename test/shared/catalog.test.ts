import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  AGENT_LIST,
  AGENTS,
  agentDefinition,
  isAgentId,
  toPresentation,
  type AgentId,
} from "../../src/shared/catalog";

const SRC = join(import.meta.dir, "..", "..", "src");
const catalogIds = (Object.keys(AGENTS) as AgentId[]).sort();

describe("catalog calculations", () => {
  test("isAgentId accepts every catalog id and rejects strangers", () => {
    for (const id of catalogIds) expect(isAgentId(id)).toBe(true);
    expect(isAgentId("tutor-faux")).toBe(false);
    expect(isAgentId("")).toBe(false);
  });

  test("agentDefinition returns the entry or null", () => {
    expect(agentDefinition("acd-tutor")?.label).toBe("ACD Tutor");
    expect(agentDefinition("tutor-faux")).toBeNull();
  });

  test("every entry's id field matches its key", () => {
    for (const id of catalogIds) expect(AGENTS[id].id).toBe(id);
  });

  test("toPresentation keeps the wire subset and drops workspace/course", () => {
    const presentation = toPresentation(AGENTS["acd-tutor"]);
    expect(presentation).toEqual({
      id: "acd-tutor",
      label: "ACD Tutor",
      description: AGENTS["acd-tutor"].description,
      greeting: AGENTS["acd-tutor"].greeting,
      farewell: AGENTS["acd-tutor"].farewell,
      actions: AGENTS["acd-tutor"].actions,
    });
    expect(presentation).not.toHaveProperty("workspace");
    expect(presentation).not.toHaveProperty("course");
  });

  test("AGENT_LIST covers the catalog", () => {
    expect(AGENT_LIST.map((a) => a.id).sort()).toEqual(catalogIds);
  });
});

/**
 * Flue discovers agents by filename, so the stub/profile/skill trio can't be
 * derived from the catalog — this test is the guard that they stay in sync.
 */
describe("filesystem consistency (AgentId ↔ stub/profile/skill)", () => {
  test("every agent id has its Flue stub, and no orphan stubs exist", async () => {
    const stubs = (await readdir(join(SRC, "agents"), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => entry.name.replace(/\.ts$/, ""))
      .sort();
    expect(stubs, "src/agents/<id>.ts must match the catalog exactly").toEqual(
      catalogIds,
    );
  });

  test("every agent id has its profile, and no orphan profiles exist", async () => {
    const profiles = (await readdir(join(SRC, "agents", "profiles")))
      .filter((name) => name.endsWith(".ts") && name !== "registry.ts")
      .map((name) => name.replace(/\.ts$/, ""))
      .sort();
    expect(
      profiles,
      "src/agents/profiles/<id>.ts must match the catalog exactly",
    ).toEqual(catalogIds);
  });

  test("every agent id has its skill directory with a SKILL.md, and no orphans", async () => {
    const skillDirs = (
      await readdir(join(SRC, "skills"), { withFileTypes: true })
    )
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(
      skillDirs,
      "src/skills/<id>/ must match the catalog exactly",
    ).toEqual(catalogIds);

    for (const id of catalogIds) {
      const files = await readdir(join(SRC, "skills", id));
      expect(files, `src/skills/${id}/ is missing SKILL.md`).toContain(
        "SKILL.md",
      );
    }
  });
});
