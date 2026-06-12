import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { OPEN_REQUEST_FILE, type OpenRequest } from "./open-request";
import { isHiddenFile } from "./shared/lesson-names";

/**
 * The one lesson-file implementation over a scratch dir, shared by the
 * agent's tools (src/tools.ts, which adapts results to the model's sentinel
 * contract) and the web server (which maps null to HTTP 404 at the wire).
 * Both sides see the same files because both go through this store.
 */

/**
 * Resolves a model-supplied filename to a safe path inside `scratchDir`
 * (calculation). basename() blocks path traversal — "../x" and "/etc/x" both
 * become leaf names.
 */
export function resolveLessonPath(scratchDir: string, filename: string): string {
  return join(scratchDir, basename(filename));
}

/**
 * argv for spawning the learner's editor (calculation): a naive whitespace
 * split of the editor command (handles "zed -w"), with the file path appended
 * as its own argument — no shell involved, so the path is never interpreted.
 */
export function editorCommand(editor: string, path: string): string[] {
  return [...editor.split(" ").filter(Boolean), path];
}

/** Actions over one agent's lesson-file workspace. */
export interface LessonFileStore {
  /** Lesson filenames, sorted; hidden bookkeeping files are excluded. */
  list(): Promise<string[]>;
  /** File contents, or null if it doesn't exist. */
  read(filename: string): Promise<string | null>;
  /** Creates or overwrites a lesson file (creating the dir if needed). */
  write(filename: string, content: string): Promise<void>;
  /**
   * Leaves the open-request signal for the web editor — the web-mode
   * equivalent of popping the file open in a local editor.
   */
  requestOpen(filename: string): Promise<void>;
  /**
   * Consumes a pending open request left by the agent's openFile tool (web
   * mode): returns the filename to open and clears the signal, or null.
   */
  takeOpenRequest(): Promise<string | null>;
  /**
   * Spawns the learner's editor on the file (non-blocking). The editor
   * command defaults to $EDITOR, then `open`.
   */
  openInEditor(filename: string, editor?: string): void;
  /** Deletes everything in the workspace (lesson files + bookkeeping). */
  clear(): Promise<void>;
}

export function createLessonFileStore(scratchDir: string): LessonFileStore {
  const resolve = (filename: string) => resolveLessonPath(scratchDir, filename);

  return {
    async list() {
      const names = await readdir(scratchDir).catch(() => [] as string[]);
      return names.filter((name) => !isHiddenFile(name)).sort();
    },
    async read(filename) {
      return readFile(resolve(filename), "utf8").catch(() => null);
    },
    async write(filename, content) {
      await mkdir(scratchDir, { recursive: true });
      await writeFile(resolve(filename), content, "utf8");
    },
    async requestOpen(filename) {
      const request: OpenRequest = {
        filename: basename(filename),
        requestedAt: Date.now(),
      };
      await writeFile(
        join(scratchDir, OPEN_REQUEST_FILE),
        JSON.stringify(request),
        "utf8",
      );
    },
    async takeOpenRequest() {
      const path = join(scratchDir, OPEN_REQUEST_FILE);
      try {
        const raw = await readFile(path, "utf8");
        await rm(path, { force: true });
        const request = JSON.parse(raw) as Partial<OpenRequest>;
        return typeof request.filename === "string"
          ? basename(request.filename)
          : null;
      } catch {
        return null;
      }
    },
    openInEditor(filename, editor) {
      const command = editorCommand(
        editor ?? process.env.EDITOR ?? "open",
        resolve(filename),
      );
      // detached + unref so a waiting editor never blocks the server process.
      spawn(command[0]!, command.slice(1), {
        detached: true,
        stdio: "ignore",
      }).unref();
    },
    async clear() {
      const names = await readdir(scratchDir).catch(() => [] as string[]);
      await Promise.all(
        names.map((name) =>
          rm(join(scratchDir, name), { force: true, recursive: true }),
        ),
      );
    },
  };
}
