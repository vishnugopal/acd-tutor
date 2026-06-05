#!/usr/bin/env bun
/**
 * Project setup: point Claude Code's auto memory at the in-repo `.claude/memory`
 * directory.
 *
 * `autoMemoryDirectory` only accepts an absolute (or `~/`-prefixed) path, so it
 * can't be committed portably. This script writes the correct absolute path for
 * the current machine into `.claude/settings.local.json` (gitignored), while the
 * memory content in `.claude/memory/` stays committed and shared via git.
 *
 * Run with: `bun run setup`
 */
import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const memoryDir = join(repoRoot, ".claude", "memory");
const settingsLocalPath = join(repoRoot, ".claude", "settings.local.json");

// 1. Ensure the committed memory directory + index exist.
await mkdir(memoryDir, { recursive: true });

const memoryIndex = Bun.file(join(memoryDir, "MEMORY.md"));
if (!(await memoryIndex.exists())) {
  await Bun.write(
    memoryIndex,
    "# Project Memory\n\nIndex of saved memories for acd-tutor. One line per memory.\n",
  );
}

// 2. Merge autoMemoryDirectory into the gitignored local settings.
let settings: Record<string, unknown> = {};
const settingsFile = Bun.file(settingsLocalPath);
if (await settingsFile.exists()) {
  try {
    settings = JSON.parse(await settingsFile.text());
  } catch {
    console.error(
      `Could not parse ${settingsLocalPath}; aborting to avoid clobbering it.`,
    );
    process.exit(1);
  }
}

settings.autoMemoryDirectory = memoryDir;

await mkdir(dirname(settingsLocalPath), { recursive: true });
await Bun.write(settingsLocalPath, JSON.stringify(settings, null, 2) + "\n");

console.log(`✓ autoMemoryDirectory → ${memoryDir}`);
console.log(`✓ wrote ${settingsLocalPath} (gitignored)`);
console.log("\nRestart your Claude Code session for the change to take effect.");
