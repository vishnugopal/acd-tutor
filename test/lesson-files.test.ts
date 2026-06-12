import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createLessonFileStore,
  editorCommand,
  resolveLessonPath,
} from "../src/lesson-files";

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

describe("editorCommand (args-array spawn shape, no shell)", () => {
  test("single-word editor", () => {
    expect(editorCommand("open", "/scratch/lesson-1.ts")).toEqual([
      "open",
      "/scratch/lesson-1.ts",
    ]);
  });

  test("multi-word editor like 'zed -w' splits into argv", () => {
    expect(editorCommand("zed -w", "/scratch/lesson-1.ts")).toEqual([
      "zed",
      "-w",
      "/scratch/lesson-1.ts",
    ]);
  });

  test("a path with spaces stays one argument", () => {
    expect(editorCommand("code", "/my scratch/lesson 1.ts")).toEqual([
      "code",
      "/my scratch/lesson 1.ts",
    ]);
  });
});

describe("LessonFileStore", () => {
  let scratchDir: string;

  beforeEach(async () => {
    scratchDir = await mkdtemp(join(tmpdir(), "acd-lesson-files-"));
  });
  afterEach(async () => {
    await rm(scratchDir, { recursive: true, force: true });
  });

  const store = () => createLessonFileStore(scratchDir);

  describe("list", () => {
    test("sorted names, dotfiles hidden", async () => {
      await writeFile(join(scratchDir, "b.ts"), "b");
      await writeFile(join(scratchDir, "a.ts"), "a");
      await writeFile(join(scratchDir, ".open-request"), "{}");
      expect(await store().list()).toEqual(["a.ts", "b.ts"]);
    });

    test("missing scratch dir → empty list", async () => {
      await rm(scratchDir, { recursive: true, force: true });
      expect(await store().list()).toEqual([]);
    });
  });

  describe("read / write", () => {
    test("round-trips contents; read of a missing file is null", async () => {
      await store().write("lesson-1.ts", "const x = 1;");
      expect(await store().read("lesson-1.ts")).toBe("const x = 1;");
      expect(await store().read("nope.ts")).toBeNull();
    });

    test("write creates the scratch dir if missing", async () => {
      await rm(scratchDir, { recursive: true, force: true });
      await store().write("fresh.ts", "x");
      expect(await readFile(join(scratchDir, "fresh.ts"), "utf8")).toBe("x");
    });

    test("traversal filenames write inside the scratch dir only", async () => {
      await store().write("../evil.ts", "pwned");
      expect(await readFile(join(scratchDir, "evil.ts"), "utf8")).toBe("pwned");
    });
  });

  describe("open requests", () => {
    test("requestOpen → takeOpenRequest round-trips and consumes the signal", async () => {
      await store().requestOpen("lesson-2.ts");
      expect(await store().takeOpenRequest()).toBe("lesson-2.ts");
      expect(await store().takeOpenRequest()).toBeNull();
    });

    test("requestOpen reduces the filename to its basename", async () => {
      await store().requestOpen("../sneaky/lesson-2.ts");
      expect(await store().takeOpenRequest()).toBe("lesson-2.ts");
    });

    test("malformed JSON in the signal file → null (and consumed)", async () => {
      await writeFile(join(scratchDir, ".open-request"), "{not json");
      expect(await store().takeOpenRequest()).toBeNull();
    });

    test("signal without a filename → null", async () => {
      await writeFile(join(scratchDir, ".open-request"), '{"requestedAt":1}');
      expect(await store().takeOpenRequest()).toBeNull();
    });

    test("no signal pending → null", async () => {
      expect(await store().takeOpenRequest()).toBeNull();
    });
  });

  describe("clear", () => {
    test("wipes lesson files and bookkeeping alike", async () => {
      await store().write("lesson-1.ts", "x");
      await store().requestOpen("lesson-1.ts");
      await store().clear();
      expect(await store().list()).toEqual([]);
      expect(await store().takeOpenRequest()).toBeNull();
    });
  });
});
