/**
 * The autosave lifecycle as an explicit state machine (calculation). The
 * useAutosave hook (hooks/useAutosave.ts) drives it with timers and writes;
 * this module owns what each event means so it's testable without a browser.
 */

export type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

export type SaveEvent =
  /** A file was opened or the on-disk baseline was reset — nothing pending. */
  | { type: "opened" }
  /** The editor content changed relative to what's on disk. */
  | { type: "edited" }
  | { type: "save-started" }
  /** Write landed; `editedMeanwhile` = the student kept typing during it. */
  | { type: "saved"; editedMeanwhile: boolean }
  | { type: "save-failed" };

export function nextSaveState(state: SaveState, event: SaveEvent): SaveState {
  switch (event.type) {
    case "opened":
      return "idle";
    case "edited":
      return "unsaved";
    case "save-started":
      return "saving";
    case "saved":
      return event.editedMeanwhile ? "unsaved" : "saved";
    case "save-failed":
      return "error";
  }
}
