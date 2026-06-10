import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createFlueClient } from "@flue/sdk";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAgentSession, type AgentChunk } from "../../src/agent-io";

/**
 * Full-stack run against the real Flue server using the dedicated `tutor-faux`
 * agent (scripted model) — no Anthropic key, fully deterministic. Gated behind
 * RUN_E2E because it runs `flue build` and spawns a server subprocess (seconds,
 * not milliseconds).
 *
 * We manage the server process here instead of reusing startFlueServer: that
 * helper calls process.exit() on shutdown, which would tear down the test
 * runner itself.
 */
describe.skipIf(!process.env.RUN_E2E)("tutor end-to-end (faux model)", () => {
  const PORT = 3899;
  const BASE_URL = `http://localhost:${PORT}`;
  const PROJECT_ROOT = join(import.meta.dir, "..", "..");

  let scratchDir: string;
  let server: Bun.Subprocess;

  beforeAll(async () => {
    scratchDir = await mkdtemp(join(tmpdir(), "acd-e2e-"));

    const build = Bun.spawn(["bunx", "--bun", "flue", "build"], {
      cwd: PROJECT_ROOT,
      stdout: "ignore",
      stderr: "pipe",
    });
    if ((await build.exited) !== 0) {
      throw new Error(`flue build failed:\n${await new Response(build.stderr).text()}`);
    }

    server = Bun.spawn(["bun", join(PROJECT_ROOT, "dist", "server.mjs")], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        PORT: String(PORT),
        ACD_TUTOR_SCRATCH_DIR: scratchDir,
      },
      stdout: "ignore",
      stderr: "inherit",
    });

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      try {
        if ((await fetch(`${BASE_URL}/openapi.json`)).ok) return;
      } catch {
        // not up yet
      }
      await Bun.sleep(150);
    }
    throw new Error("Flue server did not become ready in time.");
  }, 60_000);

  afterAll(async () => {
    server?.kill();
    await rm(scratchDir, { recursive: true, force: true });
  });

  test("streams the scripted reply and the faux tool call writes the lesson file", async () => {
    const client = createFlueClient({ baseUrl: BASE_URL });
    const session = createAgentSession(client, "tutor-faux");

    const chunks: AgentChunk[] = [];
    for await (const chunk of session.send({ message: "let's start" })) {
      chunks.push(chunk);
    }

    const reply = chunks
      .filter((c) => c.kind === "text")
      .map((c) => c.text)
      .join("");
    expect(reply).toContain("Created your first lesson");

    // The faux writeFile tool call actually ran against the host scratch dir.
    const written = await readFile(join(scratchDir, "lesson-1.ts"), "utf8");
    expect(written).toContain("Lesson 1");
  }, 30_000);
});
