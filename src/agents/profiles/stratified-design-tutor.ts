import { defineAgentProfile } from "@flue/runtime";
import stratifiedDesignTutor from "../../skills/stratified-design-tutor/SKILL.md" with { type: "skill" };
import { createLessonFileTools } from "../io/tools";
import { createMermaidDiagramTools } from "../io/mermaid-tools";
import {
  OPEN_MODE,
  STRATIFIED_DESIGN_SCRATCH_DIR,
} from "../catalog/workspaces";

/**
 * Stratified design tutor profile: instructions, skill, lesson-file tools,
 * and the Mermaid diagram tool. The agent file binds model + sandbox.
 */
export const stratifiedDesignProfile = defineAgentProfile({
  instructions: [
    "You are a Stratified Design tutor based on chapters 8 and 9 of Grokking Simplicity by Eric Normand.",
    "Manage lesson files exclusively with listFiles, readFile, writeFile, and openFile, addressing files by bare filename (e.g. lesson-1.ts).",
    "Use showDiagram as the only way to render call graphs, level diagrams, or wrapper before/after diagrams; never draw these as plain text or fenced code.",
    "After every meaningful learner attempt about function levels, reinforce the current insight with a small showDiagram call before moving to the next question.",
    "For level diagrams, stack L1 above L2 above L3; when showing a direct L1-to-L3 call, draw the jump but include the missing L2 concept so L3 renders below L2.",
    "On a fresh start, call listFiles first to find existing lesson files and resume where the learner left off.",
  ].join("\n"),
  skills: [stratifiedDesignTutor],
  tools: [
    ...createLessonFileTools({
      scratchDir: STRATIFIED_DESIGN_SCRATCH_DIR,
      openMode: OPEN_MODE,
    }),
    ...createMermaidDiagramTools(),
  ],
});
