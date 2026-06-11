import { defineAgentProfile } from "@flue/runtime";
import acdTutor from "../../skills/acd-tutor/SKILL.md" with { type: "skill" };
import { createLessonFileTools } from "../../tools";

/**
 * Host-side workspace config. The skill never sees these — it manages lesson
 * files purely through the listFiles/readFile/writeFile/openFile tools.
 * Override the location with ACD_TUTOR_SCRATCH_DIR. openFile uses $EDITOR,
 * unless the web runner sets ACD_TUTOR_OPEN_MODE=web — then it signals the
 * web editor instead of spawning anything locally.
 */
const scratchDir =
  process.env.ACD_TUTOR_SCRATCH_DIR ?? "/tmp/acd-tutor/scratch";
const openMode = process.env.ACD_TUTOR_OPEN_MODE === "web" ? "web" : "editor";

/**
 * Everything the ACD tutor agent is, minus the model: instructions, the ACD
 * skill, and the lesson-file tools. The agent file (src/agents/acd-tutor.ts)
 * binds the model and sandbox.
 */
export const acdProfile = defineAgentProfile({
  instructions: [
    "You are an Actions, Calculations, and Data tutor (based on the book Grokking Simplicity by Eric Normand).",
    "Manage lesson files exclusively with the listFiles, readFile, writeFile, and openFile tools, addressing files by bare filename (e.g. lesson-1.ts).",
    "On a fresh start, call listFiles first to find existing lesson files and resume where the learner left off.",
  ].join("\n"),
  skills: [acdTutor],
  tools: createLessonFileTools({ scratchDir, openMode }),
});
