import { defineTool, type ToolDefinition } from "@flue/runtime";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { OPEN_REQUEST_FILE, type OpenRequest } from "./open-request";

/** Sentinel returned when a requested lesson file doesn't exist. */
const FILE_NOT_FOUND = "FILE_NOT_FOUND";
/** Sentinel returned by listFiles when there are no lesson files yet. */
const NO_FILES = "NO_FILES";

/**
 * Resolves a model-supplied filename to a safe path inside `scratchDir`.
 * basename() blocks path traversal — "../x" and "/etc/x" both become leaf names.
 */
function resolveLessonPath(scratchDir: string, filename: string): string {
  return join(scratchDir, basename(filename));
}

export interface LessonFileToolOptions {
  /** Directory where lesson files are stored. */
  scratchDir: string;
  /** Editor command used by openFile. Defaults to $EDITOR, then `open`. */
  editor?: string;
  /**
   * How openFile presents the file to the learner:
   * - "editor" (default): spawn the local editor — console runner behavior.
   * - "web": write an open-request signal the web editor consumes; nothing
   *   is spawned on the host.
   */
  openMode?: "editor" | "web";
}

/**
 * Model-callable tools for managing lesson files. The agent addresses files
 * by bare filename (e.g. "lesson-1.ts"); where they live and which editor
 * opens them is host configuration the model never sees. Tool handlers run
 * in the host server process, not the sandbox.
 */
export function createLessonFileTools(
  opts: LessonFileToolOptions,
): ToolDefinition[] {
  const resolve = (filename: string) => resolveLessonPath(opts.scratchDir, filename);

  return [
    defineTool({
      name: "listFiles",
      description:
        "List the lesson files that exist in the learner's workspace, one bare filename per line (e.g. lesson-1.ts). Returns NO_FILES if there are none yet.",
      parameters: { type: "object", properties: {} },
      execute: async () => {
        const names = (await readdir(opts.scratchDir).catch(() => [] as string[]))
          // dotfiles are host bookkeeping (e.g. the open-request signal), not lessons
          .filter((name) => !name.startsWith("."));
        return names.length > 0 ? names.sort().join("\n") : NO_FILES;
      },
    }),

    defineTool({
      name: "readFile",
      description:
        "Read a lesson file from the learner's workspace by bare filename (e.g. lesson-1.ts) and return its full contents. Returns FILE_NOT_FOUND if it doesn't exist.",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Bare lesson filename, e.g. lesson-1.ts",
          },
        },
        required: ["filename"],
      },
      execute: async (args) =>
        readFile(resolve(args.filename), "utf8").catch(() => FILE_NOT_FOUND),
    }),

    defineTool({
      name: "writeFile",
      description:
        "Write (create or overwrite) a lesson file in the learner's workspace by bare filename (e.g. lesson-1.ts).",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Bare lesson filename, e.g. lesson-1.ts",
          },
          content: {
            type: "string",
            description: "Full file contents to write",
          },
        },
        required: ["filename", "content"],
      },
      execute: async (args) => {
        await mkdir(opts.scratchDir, { recursive: true });
        await writeFile(resolve(args.filename), args.content, "utf8");
        return `Wrote ${basename(args.filename)}`;
      },
    }),

    defineTool({
      name: "openFile",
      description:
        "Open an existing lesson file in the learner's editor (non-blocking) by bare filename (e.g. lesson-1.ts). Returns FILE_NOT_FOUND if it doesn't exist.",
      parameters: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Bare lesson filename, e.g. lesson-1.ts",
          },
        },
        required: ["filename"],
      },
      execute: async (args) => {
        const path = resolve(args.filename);
        const exists = await readFile(path, "utf8").then(
          () => true,
          () => false,
        );
        if (!exists) return FILE_NOT_FOUND;
        const name = basename(args.filename);
        if (opts.openMode === "web") {
          // Signal the web editor instead of touching the host: the client
          // consumes this after the reply and switches to that file's tab.
          const request: OpenRequest = { filename: name, requestedAt: Date.now() };
          await writeFile(
            join(opts.scratchDir, OPEN_REQUEST_FILE),
            JSON.stringify(request),
            "utf8",
          );
          return `Opened ${name} in the learner's editor`;
        }
        const editor = opts.editor ?? process.env.EDITOR ?? "open";
        // shell:true handles multi-word commands like "zed -w"; detached +
        // unref so a waiting editor never blocks the server process.
        spawn(`${editor} ${JSON.stringify(path)}`, {
          shell: true,
          detached: true,
          stdio: "ignore",
        }).unref();
        return `Opened ${name} in the learner's editor`;
      },
    }),
  ];
}

/** Test-only access to module-private pure helpers. Undefined outside `bun test`. */
export const __test__ =
  process.env.NODE_ENV === "test" ? { resolveLessonPath } : undefined;
