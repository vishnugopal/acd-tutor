import { defineAgentProfile } from "@flue/runtime";
import acdTutor from "../../skills/acd-tutor/SKILL.md" with { type: "skill" };
import { createLessonFileTools } from "../../tools";
import { ACD_SCRATCH_DIR, OPEN_MODE } from "../../workspaces";

/**
 * Everything the ACD tutor agent is, minus the model: instructions, the ACD
 * skill, and the lesson-file tools. The agent file (src/agents/acd-tutor.ts)
 * binds the model and sandbox. Workspace location + openFile behavior come
 * from src/workspaces.ts (ACD_TUTOR_SCRATCH_DIR / TUTOR_OPEN_MODE).
 */
export const acdProfile = defineAgentProfile({
  instructions: [
    "You are an Actions, Calculations, and Data tutor (based on the book Grokking Simplicity by Eric Normand).",
    "Manage lesson files exclusively with the listFiles, readFile, writeFile, and openFile tools, addressing files by bare filename (e.g. lesson-1.ts).",
    "On a fresh start, call listFiles first to find existing lesson files and resume where the learner left off.",
  ].join("\n"),
  skills: [acdTutor],
  tools: createLessonFileTools({ scratchDir: ACD_SCRATCH_DIR, openMode: OPEN_MODE }),
});
