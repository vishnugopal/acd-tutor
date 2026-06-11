/**
 * Host-side workspace configuration shared by agent profiles (bundled into
 * the Flue server) and the web server — single source of truth for where
 * each tutor's lesson files live and how openFile presents them.
 * Deliberately dependency-free so both sides can import it.
 */

/** How openFile presents files: local $EDITOR (console) or the web editor. */
export const OPEN_MODE: "editor" | "web" =
  process.env.TUTOR_OPEN_MODE === "web" ? "web" : "editor";

export const ACD_SCRATCH_DIR =
  process.env.ACD_TUTOR_SCRATCH_DIR ?? "/tmp/acd-tutor/scratch";

export const ESSAY_SCRATCH_DIR =
  process.env.ESSAY_TUTOR_SCRATCH_DIR ?? "/tmp/essay-tutor/scratch";

/** Lesson-file workspace per agent id (agents without one are chat-only). */
export const WORKSPACES: Record<string, string> = {
  "acd-tutor": ACD_SCRATCH_DIR,
  "argumentative-essay-tutor": ESSAY_SCRATCH_DIR,
};
