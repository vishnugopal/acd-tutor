import { useCallback, useEffect, useRef, useState } from "react";
import { writeLessonFile } from "../api";
import { nextSaveState, type SaveEvent, type SaveState } from "../lib/autosave";

const AUTOSAVE_DELAY_MS = 1000;

export interface UseAutosaveOptions {
  agentId: string;
  /** Active filename, or null when no file is open. */
  file: string | null;
  /** Current editor content. */
  content: string;
}

export interface Autosave {
  saveState: SaveState;
  /** True when the editor content differs from what's known to be on disk. */
  isDirty: boolean;
  /**
   * Writes any pending edit now. Returns false when the write fails —
   * callers must NOT discard the editor content in that case (the old
   * fire-and-forget flush silently lost the student's work).
   */
  flush: () => Promise<boolean>;
  /**
   * Resets the on-disk baseline: the file was just opened, the tutor rewrote
   * it, or the workspace was wiped. Clears any pending-save bookkeeping.
   */
  markSaved: (content: string) => void;
}

/**
 * Debounced autosave over the lesson-file API: saves once typing goes quiet,
 * with one automatic retry after a failed write (the effect's deps don't
 * change on a failure, so without the retry nonce the error state would
 * dead-end until the next keystroke).
 */
export function useAutosave({
  agentId,
  file,
  content,
}: UseAutosaveOptions): Autosave {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [retryNonce, setRetryNonce] = useState(0);
  const savedRef = useRef(""); // last content known to be on disk
  const contentRef = useRef(content);
  contentRef.current = content;
  const fileRef = useRef(file);
  fileRef.current = file;
  const retriedRef = useRef(false); // one automatic retry per failure

  const dispatch = (event: SaveEvent) =>
    setSaveState((prev) => nextSaveState(prev, event));

  const markSaved = useCallback((value: string) => {
    savedRef.current = value;
    retriedRef.current = false;
    setSaveState((prev) => nextSaveState(prev, { type: "opened" }));
  }, []);

  const save = useCallback(
    async (snapshot: string, target: string): Promise<boolean> => {
      dispatch({ type: "save-started" });
      try {
        await writeLessonFile(agentId, target, snapshot);
        savedRef.current = snapshot;
        retriedRef.current = false;
        dispatch({
          type: "saved",
          editedMeanwhile: contentRef.current !== snapshot,
        });
        return true;
      } catch {
        dispatch({ type: "save-failed" });
        return false;
      }
    },
    [agentId],
  );

  // Autosave: debounce while typing; save once the editor goes quiet.
  useEffect(() => {
    if (file === null) return;
    if (content === savedRef.current) return;
    dispatch({ type: "edited" });
    const timer = setTimeout(async () => {
      const snapshot = contentRef.current;
      const target = fileRef.current;
      if (target === null) return;
      const ok = await save(snapshot, target);
      if (!ok && !retriedRef.current) {
        retriedRef.current = true;
        setRetryNonce((n) => n + 1); // re-arm the timer once on error
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [content, file, retryNonce, save]);

  const flush = useCallback(async (): Promise<boolean> => {
    const target = fileRef.current;
    if (target === null || contentRef.current === savedRef.current) return true;
    return save(contentRef.current, target);
  }, [save]);

  return {
    saveState,
    isDirty: content !== savedRef.current,
    flush,
    markSaved,
  };
}
