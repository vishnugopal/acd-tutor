import { AGENT_CHOICES } from "../agents/profiles/registry";
import { createAgentSession } from "../agents/io/agent-io";
import { isAgentId } from "../agents/catalog/catalog";
import { createLessonFileStore } from "../shared/lesson-files";
import { startFlueServer } from "../shared/runner";
import { workspaceDir } from "../agents/catalog/workspaces";
import { resolveConsoleActions } from "./actions";
import { runConsole } from ".";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "Error: ANTHROPIC_API_KEY is not set. Set it in .env before starting the tutor.",
  );
  process.exit(1);
}

console.log("Preparing tutor...");
const { client, shutdown } = await startFlueServer({ port: 3789 });

await runConsole({
  agents: AGENT_CHOICES,
  emptyReplyMessage: "(The tutor had nothing to say.)",
  resolveActions: (choice) =>
    resolveConsoleActions(choice, async (agentId) => {
      if (!isAgentId(agentId)) return [];
      const dir = workspaceDir(agentId);
      if (dir === null) return [];
      return createLessonFileStore(dir).list();
    }),
  createReply: (id) => {
    const session = createAgentSession(client, id);
    return (line) => session.send({ message: line });
  },
});

shutdown(0);
