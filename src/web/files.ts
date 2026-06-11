import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { OPEN_REQUEST_FILE, type OpenRequest } from "../open-request";

/**
 * Host-side lesson-file store for the web app — the browser-facing analog of
 * the agent's lesson-file tools (src/tools.ts). Both operate on the same
 * scratch dir, so the editor and the tutor's readFile/writeFile see the same
 * files. Filenames are reduced to their basename, mirroring the tools' path-
 * traversal guard.
 */
export interface LessonFileStore {
  list(): Promise<string[]>;
  read(filename: string): Promise<string | null>;
  write(filename: string, content: string): Promise<void>;
  /**
   * Consumes a pending open request left by the agent's openFile tool (web
   * mode): returns the filename to open and clears the signal, or null.
   */
  takeOpenRequest(): Promise<string | null>;
  /** Deletes everything in the workspace (lesson files + bookkeeping). */
  clear(): Promise<void>;
}

export function createLessonFileStore(scratchDir: string): LessonFileStore {
  const resolve = (filename: string) => join(scratchDir, basename(filename));

  return {
    async list() {
      const names = await readdir(scratchDir).catch(() => [] as string[]);
      // dotfiles are host bookkeeping (e.g. the open-request signal), not lessons
      return names.filter((name) => !name.startsWith(".")).sort();
    },
    async read(filename) {
      return readFile(resolve(filename), "utf8").catch(() => null);
    },
    async write(filename, content) {
      await mkdir(scratchDir, { recursive: true });
      await writeFile(resolve(filename), content, "utf8");
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
