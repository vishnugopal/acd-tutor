import { useCallback, useRef, useState } from "react";
import { listLessonFiles, readLessonFile, takeOpenRequest } from "../api";
import {
  latestLessonFile,
  lessonNumber,
  sortLessonFiles,
} from "../../../shared/lesson-names";

/**
 * What one workspace sync should do (data). Decided by planSync — a pure
 * decision tree over the tutor's workspace vs the editor's state — and
 * executed by the useLessonFileSync hook.
 */
export type SyncPlan =
  | { kind: "none" }
  /** Switch the editor to `file` (flushing pending edits first). */
  | { kind: "open"; file: string; toast: string }
  /** A new lesson exists but the student is mid-edit — announce, don't yank. */
  | { kind: "toast"; toast: string }
  /** Re-read the active file: the tutor may have rewritten it. */
  | { kind: "refresh"; file: string };

export interface SyncInput {
  /** Lesson files in the workspace, sorted. */
  files: string[];
  /** Pending openFile request from the tutor, if any. */
  openRequest: string | null;
  /** File currently open in the editor, or null. */
  active: string | null;
  /** Editor content differs from what's on disk. */
  dirty: boolean;
}

/** The file-sync decision tree (calculation): open-request wins → first file → newer-and-clean → tutor-rewrote-current. */
export function planSync({ files, openRequest, active, dirty }: SyncInput): SyncPlan {
  // The tutor's openFile call (web mode) wins: open exactly that file.
  if (openRequest && files.includes(openRequest) && openRequest !== active) {
    return {
      kind: "open",
      file: openRequest,
      toast: `📂 Beep opened ${openRequest} for you`,
    };
  }

  const newest = latestLessonFile(files);
  if (!newest) return { kind: "none" };
  if (active === null) {
    // First file just appeared — open it.
    return { kind: "open", file: newest, toast: `📂 ${newest} is ready!` };
  }
  const newer =
    newest !== active &&
    (lessonNumber(newest) ?? 0) > (lessonNumber(active) ?? 0);
  if (newer) {
    // Don't yank unsaved work out from under the student.
    return dirty
      ? { kind: "toast", toast: `📂 New lesson ready: ${newest}` }
      : { kind: "open", file: newest, toast: `📂 ${newest} unlocked!` };
  }
  return dirty ? { kind: "none" } : { kind: "refresh", file: active };
}

/** The editor state a sync plans against, captured at sync time. */
export interface SyncSnapshot {
  active: string | null;
  dirty: boolean;
  content: string;
}

export interface LessonFileSyncHandlers {
  snapshot: () => SyncSnapshot;
  /** Flushes pending edits; false = write failed, don't discard the editor. */
  flush: () => Promise<boolean>;
  /** Opens `name` in the editor. */
  open: (name: string) => Promise<void>;
  /** Replaces the active file's content (the tutor rewrote it). */
  replace: (content: string) => void;
  toast: (message: string) => void;
}

export interface LessonFileSync {
  /** Lesson files in the workspace, sorted — drives the tab bar. */
  files: string[];
  /** Syncs with the tutor's workspace (run after every reply). */
  sync: () => Promise<void>;
  /** Empties the file list (start from scratch). */
  resetFiles: () => void;
}

/**
 * Keeps the editor in step with the workspace the tutor's tools manage:
 * fetch the file list, consume any open request, then execute the planSync
 * decision. Handlers are read through a ref so the hook never goes stale.
 */
export function useLessonFileSync(
  agentId: string,
  handlers: LessonFileSyncHandlers,
): LessonFileSync {
  const [files, setFiles] = useState<string[]>([]);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const sync = useCallback(async () => {
    const latest = sortLessonFiles(await listLessonFiles(agentId));
    setFiles(latest);
    const openRequest = await takeOpenRequest(agentId).catch(() => null);
    const { active, dirty, content } = handlersRef.current.snapshot();
    const plan = planSync({ files: latest, openRequest, active, dirty });

    switch (plan.kind) {
      case "none":
        return;
      case "toast":
        handlersRef.current.toast(plan.toast);
        return;
      case "open":
        if (!(await handlersRef.current.flush())) {
          // The pending edit couldn't be written — switching now would
          // overwrite the editor and lose it.
          handlersRef.current.toast(
            "⚠️ Couldn't save your work — staying on this file.",
          );
          return;
        }
        await handlersRef.current.open(plan.file);
        handlersRef.current.toast(plan.toast);
        return;
      case "refresh": {
        const fresh = await readLessonFile(agentId, plan.file);
        if (fresh !== null && fresh !== content) {
          handlersRef.current.replace(fresh);
        }
        return;
      }
    }
  }, [agentId]);

  const resetFiles = useCallback(() => setFiles([]), []);

  return { files, sync, resetFiles };
}
