/**
 * Contract between the openFile tool (web mode) and the web editor: instead
 * of spawning a local editor, the tool drops this hidden file in the scratch
 * dir; the web client consumes it after each reply and opens that tab.
 * Dotfiles are excluded from every lesson-file listing, so neither the model
 * nor the student ever sees it.
 */
export const OPEN_REQUEST_FILE = ".open-request";

export interface OpenRequest {
  /** Bare lesson filename to open, e.g. "lesson-2.ts". */
  filename: string;
  requestedAt: number;
}
