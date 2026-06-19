import type { AgentAction } from "./catalog";

/** The shared workbook-start action shown before any lesson files exist. */
export const START_LESSON_ACTION: AgentAction = {
  label: "Start",
  message: "start",
};

/**
 * Workbook chat action selection (calculation): start first, then the
 * agent's normal actions once lesson files exist.
 */
export function lessonChatActions(
  files: string[],
  agentActions: AgentAction[] | undefined,
): AgentAction[] {
  return files.length === 0 ? [START_LESSON_ACTION] : (agentActions ?? []);
}
