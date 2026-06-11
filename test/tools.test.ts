import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { ToolDefinition } from "@flue/runtime";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { __test__, createLessonFileTools } from "../src/tools";

const { resolveLessonPath } = __test__!;

/** Looks up a tool's execute() by name from the factory output. */
function tool(tools: ToolDefinition[], name: string) {
  const found = tools.find((t) => t.name === name);
  if (!found) throw new Error(`tool not found: ${name}`);
  return (args: Record<string, unknown>) =>
    (found.execute as (a: Record<string, unknown>) => Promise<string>)(args);
}

describe("resolveLessonPath (path-traversal guard)", () => {
  test("joins a bare filename onto the scratch dir", () => {
    expect(resolveLessonPath("/scratch", "lesson-1.ts")).toBe("/scratch/lesson-1.ts");
  });

  test("collapses ../ traversal to the leaf name inside scratch", () => {
    expect(resolveLessonPath("/scratch", "../../etc/passwd")).toBe("/scratch/passwd");
  });

  test("collapses an absolute path to the leaf name inside scratch", () => {
    expect(resolveLessonPath("/scratch", "/etc/passwd")).toBe("/scratch/passwd");
  });
});

describe("createLessonFileTools handlers", () => {
  let scratchDir: string;

  beforeEach(async () => {
    scratchDir = await mkdtemp(join(tmpdir(), "acd-tools-"));
  });
  afterEach(async () => {
    await rm(scratchDir, { recursive: true, force: true });
  });

  const tools = () => createLessonFileTools({ scratchDir });

  describe("listFiles", () => {
    test("returns NO_FILES for an empty workspace", async () => {
      expect(await tool(tools(), "listFiles")({})).toBe("NO_FILES");
    });

    test("returns sorted filenames joined by newlines", async () => {
      await writeFile(join(scratchDir, "b.ts"), "b");
      await writeFile(join(scratchDir, "a.ts"), "a");
      expect(await tool(tools(), "listFiles")({})).toBe("a.ts\nb.ts");
    });

    test("hides dotfiles (host bookkeeping like the open-request signal)", async () => {
      await writeFile(join(scratchDir, "lesson-1.ts"), "x");
      await writeFile(join(scratchDir, ".open-request"), "{}");
      expect(await tool(tools(), "listFiles")({})).toBe("lesson-1.ts");
    });

    test("returns NO_FILES when the scratch dir does not exist", async () => {
      await rm(scratchDir, { recursive: true, force: true });
      expect(await tool(tools(), "listFiles")({})).toBe("NO_FILES");
    });
  });

  describe("readFile", () => {
    test("returns file contents for an existing file", async () => {
      await writeFile(join(scratchDir, "lesson-1.ts"), "const x = 1;");
      expect(await tool(tools(), "readFile")({ filename: "lesson-1.ts" })).toBe("const x = 1;");
    });

    test("returns FILE_NOT_FOUND for a missing file", async () => {
      expect(await tool(tools(), "readFile")({ filename: "nope.ts" })).toBe("FILE_NOT_FOUND");
    });
  });

  describe("writeFile", () => {
    test("creates the file and reports the bare name", async () => {
      const result = await tool(tools(), "writeFile")({ filename: "lesson-2.ts", content: "hi" });
      expect(result).toBe("Wrote lesson-2.ts");
      expect(await readFile(join(scratchDir, "lesson-2.ts"), "utf8")).toBe("hi");
    });

    test("creates the scratch dir if it is missing (mkdir recursive)", async () => {
      await rm(scratchDir, { recursive: true, force: true });
      await tool(tools(), "writeFile")({ filename: "fresh.ts", content: "x" });
      expect(await readFile(join(scratchDir, "fresh.ts"), "utf8")).toBe("x");
    });

    test("round-trips through readFile", async () => {
      await tool(tools(), "writeFile")({ filename: "rt.ts", content: "round" });
      expect(await tool(tools(), "readFile")({ filename: "rt.ts" })).toBe("round");
    });

    test("a traversal filename writes inside the scratch dir only", async () => {
      const result = await tool(tools(), "writeFile")({ filename: "../evil.ts", content: "pwned" });
      expect(result).toBe("Wrote evil.ts");
      // Lands at scratchDir/evil.ts, never the parent.
      expect(await readFile(join(scratchDir, "evil.ts"), "utf8")).toBe("pwned");
    });
  });

  describe("openFile", () => {
    test("returns FILE_NOT_FOUND for a missing file (no editor spawned)", async () => {
      expect(await tool(tools(), "openFile")({ filename: "ghost.ts" })).toBe("FILE_NOT_FOUND");
    });
  });

  describe("openFile (web mode)", () => {
    const webTools = () => createLessonFileTools({ scratchDir, openMode: "web" });

    test("writes an open-request signal instead of spawning an editor", async () => {
      await writeFile(join(scratchDir, "lesson-2.ts"), "x");
      const result = await tool(webTools(), "openFile")({ filename: "lesson-2.ts" });
      expect(result).toBe("Opened lesson-2.ts in the learner's editor");
      const request = JSON.parse(
        await readFile(join(scratchDir, ".open-request"), "utf8"),
      ) as { filename: string; requestedAt: number };
      expect(request.filename).toBe("lesson-2.ts");
      expect(request.requestedAt).toBeGreaterThan(0);
    });

    test("missing file: FILE_NOT_FOUND and no signal written", async () => {
      expect(await tool(webTools(), "openFile")({ filename: "ghost.ts" })).toBe("FILE_NOT_FOUND");
      await expect(readFile(join(scratchDir, ".open-request"), "utf8")).rejects.toThrow();
    });
  });
});
