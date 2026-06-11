import { AGENT_CHOICES } from "../agents/profiles/registry";
import { startFlueServer } from "../runner";
import { startWebServer } from "./server";

/**
 * Web runner entry (`bun start`): boots the Flue agent server exactly like
 * the console runner does, then serves the Code Buddy web app on top of it.
 */

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "Error: ANTHROPIC_API_KEY is not set. Set it in .env before starting the tutor.",
  );
  process.exit(1);
}

console.log("Preparing tutor...");
// The Flue server inherits this env: the ACD tutor's openFile tool signals
// the web editor instead of spawning the local $EDITOR.
process.env.ACD_TUTOR_OPEN_MODE = "web";
const { client } = await startFlueServer({ port: 3789 });

const web = startWebServer({
  client,
  agents: AGENT_CHOICES,
  port: Number(process.env.WEB_PORT ?? 3790),
});

console.log(`Code Buddy is ready → ${web.url}`);
// Bun.serve keeps the process alive; the Flue subprocess is torn down by the
// signal/exit hooks installed in startFlueServer.
