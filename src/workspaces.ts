import {
  AGENTS,
  type AgentDefinition,
  type AgentId,
} from "./shared/catalog";

/**
 * Host-side workspace resolution shared by agent profiles (bundled into the
 * Flue server) and the web server. Which agents have a workspace — and their
 * env vars and defaults — is catalog data (src/shared/catalog.ts); this
 * module is the one place that reads process.env to resolve it.
 */

/** How openFile presents files: local $EDITOR (console) or the web editor. */
export const OPEN_MODE: "editor" | "web" =
  process.env.TUTOR_OPEN_MODE === "web" ? "web" : "editor";

/**
 * Scratch dir for one agent: the catalog's env override, falling back to its
 * default. Null for chat-only agents.
 */
export function workspaceDir(id: AgentId): string | null {
  const { workspace } = AGENTS[id] as AgentDefinition;
  if (!workspace) return null;
  return process.env[workspace.dirEnvVar] ?? workspace.defaultDir;
}

/** Lesson-file workspace per agent id (agents without one are chat-only). */
export const WORKSPACES: Record<string, string> = Object.fromEntries(
  (Object.keys(AGENTS) as AgentId[]).flatMap((id) => {
    const dir = workspaceDir(id);
    return dir === null ? [] : [[id, dir] as const];
  }),
);

export const ACD_SCRATCH_DIR = workspaceDir("acd-tutor")!;

export const ESSAY_SCRATCH_DIR = workspaceDir("argumentative-essay-tutor")!;
