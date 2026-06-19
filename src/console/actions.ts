import { agentDefinition } from "../shared/catalog";
import { lessonChatActions } from "../shared/lesson-actions";
import type { AgentChoice, ConsoleAction } from "./types";

/**
 * Console action resolution: workbook agents show Start until lesson files
 * exist; chat-only agents keep their catalog actions.
 */
export async function resolveConsoleActions(
  choice: Pick<AgentChoice, "id" | "actions">,
  listFiles: (agentId: string) => Promise<string[]>,
): Promise<ConsoleAction[]> {
  const def = agentDefinition(choice.id);
  const fallback = choice.actions ?? [];
  if (def === null || def.workspace === undefined) return fallback;
  const files = await listFiles(choice.id).catch(() => []);
  return lessonChatActions(files, fallback);
}
