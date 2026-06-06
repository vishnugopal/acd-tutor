import { createAgentSession } from "./agent-io";
import { runConsole } from "./console";
import { startFlueServer } from "./runner";

const GREETING = `Hi! Welcome to ACD tutor!

I'll teach you to tell apart Actions, Calculations, and Data in real code.
Say "let's start" (or anything, really) and I'll set up your first lesson —
or pick up right where you left off.
`;

const FAREWELL = `Goodbye! Happy learning!`;

const CHECK_MY_WORK_PROMPT = `Please check my work: read my current lesson file, review what I've done so far, and give me feedback.`;

console.log("Preparing tutor...");
const { client, shutdown } = await startFlueServer({ port: 3789 });

const tutor = createAgentSession(client, "main");

await runConsole({
  greeting: GREETING,
  farewell: FAREWELL,
  emptyReplyMessage: "(The tutor had nothing to say.)",
  reply: (line) => tutor.send({ message: line }),
  actions: [{ label: "Check my work", message: CHECK_MY_WORK_PROMPT }],
});

shutdown(0);
