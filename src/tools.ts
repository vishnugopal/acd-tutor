import { defineTool, type ToolDefinition } from "@flue/runtime";
import { basename } from "node:path";
import { createLessonFileStore } from "./lesson-files";

/**
 * Sentinels are the model's prompt contract — the SKILL.md instructions
 * reference them — so they live here at the model boundary, translating the
 * store's null/void results into what the agent expects to read.
 */

/** Sentinel returned when a requested lesson file doesn't exist. */
const FILE_NOT_FOUND = "FILE_NOT_FOUND";
/** Sentinel returned by listFiles when there are no lesson files yet. */
const NO_FILES = "NO_FILES";

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
 * Model-callable tools for managing lesson files — a thin sentinel adapter
 * over the shared LessonFileStore (src/lesson-files.ts). The agent addresses
 * files by bare filename (e.g. "lesson-1.ts"); where they live and which
 * editor opens them is host configuration the model never sees. Tool handlers
 * run in the host server process, not the sandbox.
 */
export function createLessonFileTools(
  opts: LessonFileToolOptions,
): ToolDefinition[] {
  const store = createLessonFileStore(opts.scratchDir);

  return [
    defineTool({
      name: "listFiles",
      description:
        "List the lesson files that exist in the learner's workspace, one bare filename per line (e.g. lesson-1.ts). Returns NO_FILES if there are none yet.",
      parameters: { type: "object", properties: {} },
      execute: async () => {
        const names = await store.list();
        return names.length > 0 ? names.join("\n") : NO_FILES;
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
        (await store.read(args.filename)) ?? FILE_NOT_FOUND,
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
        await store.write(args.filename, args.content);
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
        if ((await store.read(args.filename)) === null) return FILE_NOT_FOUND;
        const name = basename(args.filename);
        if (opts.openMode === "web") {
          // Signal the web editor instead of touching the host: the client
          // consumes this after the reply and switches to that file's tab.
          await store.requestOpen(name);
        } else {
          store.openInEditor(name, opts.editor);
        }
        return `Opened ${name} in the learner's editor`;
      },
    }),
  ];
}
