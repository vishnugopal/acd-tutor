import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import acdTutor from "../skills/acd-tutor/SKILL.md" with { type: "skill" };

import { local } from "@flue/runtime/node";

/** Where lesson scratch files live. Override with ACD_TUTOR_SCRATCH_DIR. */
const scratchDir = process.env.ACD_TUTOR_SCRATCH_DIR ?? "/tmp/acd-tutor/scratch";

/**
 * Exporting this middleware opts the agent into the HTTP transport at
 * POST /agents/main/:id (used by the CLI in src/main.ts via @flue/sdk).
 */
export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  model: "anthropic/claude-sonnet-4-6",
  instructions: [
    "You are an ACD tutor.",
    `The lesson scratch directory is: ${scratchDir}`,
    "Write lesson files into that directory and read the learner's edits from it.",
    "On a fresh start, inspect the scratch directory first to identify where in the lesson plan the learner is, and resume from there.",
  ].join("\n"),
  skills: [acdTutor],
  // The local sandbox only exposes an explicit allowlist of env vars, so the
  // host's $EDITOR must be forwarded for the skill's `${EDITOR:-...}` to work.
  sandbox: local({ env: { EDITOR: process.env.EDITOR } }),
  cwd: process.cwd(),
}));
