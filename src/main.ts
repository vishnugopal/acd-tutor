import { createAgentSession } from "./agent-io";
import { runConsole } from "./console";
import { startFlueServer } from "./runner";

const GREETING = `Hi! Welcome to ACD tutor!

I'll teach you to tell apart Actions, Calculations, and Data in real code.
Say "let's start" (or anything, really) and I'll set up your first lesson —
or pick up right where you left off.
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
