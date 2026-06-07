import { createFlueClient, type FlueClient } from "@flue/sdk";

export interface FlueServerOptions {
  /** Port to run the Flue server on. */
  port?: number;
  /** Directory containing flue.config.ts (and dist/ after a build). */
  projectRoot?: string;
  /** How long to wait for the server to become ready. */
  readyTimeoutMs?: number;
  /** Skip `flue build` if the bundle is already built. */
  skipBuild?: boolean;
}

export interface FlueServer {
  baseUrl: string;
  client: FlueClient;
  shutdown(code?: number): never;
}

/**
 * Builds the agent bundle, spawns the Flue server, and waits for it to be
 * ready. Agent-agnostic: callers pick which agent to invoke via the returned
 * client.
 */
export async function startFlueServer(
  options: FlueServerOptions = {},
): Promise<FlueServer> {
  const {
    port = 3789,
    projectRoot = `${import.meta.dir}/..`,
    readyTimeoutMs = 10_000,
    skipBuild = false,
  } = options;
  const baseUrl = `http://localhost:${port}`;
  const serverPath = `${projectRoot}/dist/server.mjs`;

  if (!skipBuild) {
    // --bun runs the flue CLI under Bun's runtime (the installed Node is older
    // than the >=22.18 Flue requires).
    const build = Bun.spawn(["bunx", "--bun", "flue", "build"], {
      cwd: projectRoot,
      stdout: "ignore",
      stderr: "pipe",
    });
    if ((await build.exited) !== 0) {
      console.error(await new Response(build.stderr).text());
      console.error("Flue build failed — see errors above.");
      process.exit(1);
    }
  }

  const server = Bun.spawn(["bun", serverPath], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port) },
    stdout: "ignore",
    stderr: "inherit",
  });

  let shuttingDown = false;
  function shutdown(code = 0): never {
    shuttingDown = true;
    server.kill("SIGTERM");
    process.exit(code);
  }
  // Kill the server on every way out: signals (Ctrl+C, kill, terminal/pty
  // closing) and any process.exit — otherwise it orphans and holds the port.
  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
  process.on("SIGHUP", () => shutdown(0));
  process.on("exit", () => {
    shuttingDown = true;
    server.kill("SIGTERM");
  });
  server.exited.then((code) => {
    if (!shuttingDown) {
      console.error(`\nFlue server exited unexpectedly (code ${code}).`);
      process.exit(1);
    }
  });

  // Wait for the server to be ready.
  const deadline = Date.now() + readyTimeoutMs;
  while (true) {
    try {
      const res = await fetch(`${baseUrl}/openapi.json`);
      if (res.ok) break;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) {
      console.error("Flue server did not become ready in time.");
      shutdown(1);
    }
    await Bun.sleep(150);
  }

  const client = createFlueClient({ baseUrl });
  return { baseUrl, client, shutdown };
}
