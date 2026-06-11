import { defineAgentProfile } from "@flue/runtime";
import essayTutor from "../../skills/argumentative-essay-tutor/SKILL.md" with { type: "skill" };
import { createLessonFileTools } from "../../tools";
import { ESSAY_SCRATCH_DIR, OPEN_MODE } from "../../workspaces";

/**
 * Everything the essay tutor agent is, minus the model: instructions, the
 * argumentative-essay skill, and the lesson-file tools (Markdown workbook
 * files). The agent file (src/agents/argumentative-essay-tutor.ts) binds the
 * model and sandbox. Workspace location + openFile behavior come from
 * src/workspaces.ts (ESSAY_TUTOR_SCRATCH_DIR / TUTOR_OPEN_MODE).
 */
export const essayProfile = defineAgentProfile({
  instructions: [
    "You are an argumentative-essay writing tutor for school students. Follow the argumentative-essay-tutor skill exactly.",
    "Manage lesson files exclusively with the listFiles, readFile, writeFile, and openFile tools, addressing files by bare filename (e.g. lesson-1.md).",
    "Lesson files are plain CommonMark Markdown — no HTML, no JSX.",
    "On a fresh start, call listFiles first to find existing lesson files and resume where the student left off.",
  ].join("\n"),
  skills: [essayTutor],
  tools: createLessonFileTools({ scratchDir: ESSAY_SCRATCH_DIR, openMode: OPEN_MODE }),
});
