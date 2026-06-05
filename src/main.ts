import { createAgentSession } from "./agent-io";
import { runConsole } from "./console";
import { startFlueServer } from "./runner";

const GREETING = `Hi! Welcome to ACD tutor!

I'm here to explain any concept to you. Can you tell me what you'd like to learn today?
`;

const FAREWELL = `Goodbye! Happy learning!`;

console.log("Preparing tutor...");
const { client, shutdown } = await startFlueServer({ port: 3789 });

const tutor = createAgentSession(client, "main");

await runConsole({
  greeting: GREETING,
  farewell: FAREWELL,
  emptyReplyMessage: "(The tutor had nothing to say.)",
  reply: (line) => tutor.send({ message: line }),
});

shutdown(0);
