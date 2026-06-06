import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import acdTutor from "../skills/acd-tutor/SKILL.md" with { type: "skill" };
import { createLessonFileTools } from "../tools";

import { local } from "@flue/runtime/node";

/**
 * Host-side workspace config. The skill never sees these — it manages lesson
 * files purely through the listFiles/readFile/writeFile/openFile tools.
 * Override the location with ACD_TUTOR_SCRATCH_DIR; openFile uses $EDITOR.
 */
const scratchDir =
  process.env.ACD_TUTOR_SCRATCH_DIR ?? "/tmp/acd-tutor/scratch";

/**
 * Exporting this middleware opts the agent into the HTTP transport at
 * POST /agents/main/:id (used by the CLI in src/main.ts via @flue/sdk).
 */
export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  model: "anthropic/claude-sonnet-4-6",
  instructions: [
    "You are an Actions, Calculations, and Data tutor (based on the book Grokking Simplicity by Eric Normand).",
    "Manage lesson files exclusively with the listFiles, readFile, writeFile, and openFile tools, addressing files by bare filename (e.g. lesson-1.ts).",
    "On a fresh start, call listFiles first to find existing lesson files and resume where the learner left off.",
  ].join("\n"),
  skills: [acdTutor],
  tools: createLessonFileTools({ scratchDir }),
  sandbox: local(),
  cwd: process.cwd(),
}));
