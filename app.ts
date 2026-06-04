import { createInterface } from "node:readline/promises";
import { createFlueClient } from "@flue/sdk";

const PORT = 3789;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_PATH = `${import.meta.dir}/dist/server.mjs`;

const GREETING = `Hi! Welcome to ACD tutor!

I'm here to explain any concept to you. Can you tell me what you'd like to learn today?
`;

// --- 1. Build the agent bundle so edits to agents/ and skills/ are picked up ---
console.log("Preparing tutor...");
// --bun runs the flue CLI under Bun's runtime (the installed Node is older
// than the >=22.18 Flue requires).
const build = Bun.spawn(["bunx", "--bun", "flue", "build"], {
  cwd: import.meta.dir,
  stdout: "ignore",
  stderr: "pipe",
});
if ((await build.exited) !== 0) {
  console.error(await new Response(build.stderr).text());
  console.error("Build failed — see errors above.");
  process.exit(1);
}

// --- 2. Spawn the Flue server ---
const server = Bun.spawn(["bun", SERVER_PATH], {
  cwd: import.meta.dir,
  env: { ...process.env, PORT: String(PORT) },
  stdout: "ignore",
  stderr: "inherit",
});

let shuttingDown = false;
function shutdown(code = 0): never {
  shuttingDown = true;
  server.kill("SIGTERM");
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
server.exited.then((code) => {
  if (!shuttingDown) {
    console.error(`\nTutor server exited unexpectedly (code ${code}).`);
    process.exit(1);
  }
});

// --- 3. Wait for the server to be ready ---
const deadline = Date.now() + 10_000;
while (true) {
  try {
    const res = await fetch(`${BASE_URL}/openapi.json`);
    if (res.ok) break;
  } catch {
    // not up yet
  }
  if (Date.now() > deadline) {
    console.error("Tutor server did not become ready in time.");
    shutdown(1);
  }
  await Bun.sleep(150);
}

// --- 4. Create the agent client ---
// Each REPL line is a streaming HTTP invoke via @flue/sdk (SSE under the
// hood); conversation memory lives server-side on this instance id for the
// lifetime of the run.
const client = createFlueClient({ baseUrl: BASE_URL });
const instanceId = `cli_${crypto.randomUUID()}`;

// Streams the reply to stdout as it is generated. `onFirstOutput` fires just
// before the first printed chunk (used to clear the thinking… indicator).
async function askTutor(
  message: string,
  onFirstOutput: () => void,
): Promise<void> {
  const stream = client.agents.invoke("main", instanceId, {
    mode: "stream",
    payload: { message },
  });
  let printed = false;
  for await (const event of stream) {
    if (event.type !== "text_delta") continue;
    if (!printed) {
      onFirstOutput();
      process.stdout.write("\n");
      printed = true;
    }
    process.stdout.write(event.text);
  }
  if (printed) process.stdout.write("\n\n");
  else {
    onFirstOutput();
    console.log("\n(The tutor had nothing to say.)\n");
  }
}

// --- 5. Greeting + REPL ---
console.log();
console.log(GREETING);

const rl = createInterface({ input: process.stdin, output: process.stdout });

// The async iterator (unlike rl.question) buffers lines that arrive while a
// reply is still pending, so piped input and fast typers don't lose messages.
rl.setPrompt("> ");
rl.prompt();
for await (const input of rl) {
  const line = input.trim();
  if (!line) {
    rl.prompt();
    continue;
  }
  if (line === "exit" || line === "quit") break;

  const tty = process.stdout.isTTY;
  if (tty) process.stdout.write("thinking…");
  let cleared = !tty;
  const clearIndicator = () => {
    if (!cleared) process.stdout.write("\r\x1b[K");
    cleared = true;
  };
  try {
    await askTutor(line, clearIndicator);
  } catch (err) {
    clearIndicator();
    console.error(`[error] ${err instanceof Error ? err.message : err}`);
  }
  rl.prompt();
}

console.log("\nGoodbye! Happy learning!");
rl.close();
shutdown(0);
