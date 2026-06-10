import { createAgentSession } from "./agent-io";
import { AGENT_CHOICES } from "./agents/profiles/registry";
import { runConsole } from "./console";
import { startFlueServer } from "./runner";

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
  createReply: (id) => {
    const session = createAgentSession(client, id);
    return (line) => session.send({ message: line });
  },
});

shutdown(0);
