import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createFlueClient } from "@flue/sdk";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startWebServer, type WebServer } from "../../src/web/server";

/**
 * End-to-end test of the web layer (src/web/server.ts) against a real Flue
 * server running the scripted `tutor-faux` agent — no Anthropic key, fully
 * deterministic. Mirrors tutor.e2e.test.ts's server lifecycle; on top of it,
 * the web server runs in-process and we exercise its HTTP API the way the
 * browser client does: agents → session → SSE message stream → lesson files.
 */
describe.skipIf(!process.env.RUN_E2E)("web runner end-to-end (faux model)", () => {
  const FLUE_PORT = 3897;
  const WEB_PORT = 3898;
  const FLUE_URL = `http://localhost:${FLUE_PORT}`;
  const WEB_URL = `http://localhost:${WEB_PORT}`;
  const REPO_ROOT = join(import.meta.dir, "..", "..");
  const E2E_CONFIG = join(import.meta.dir, "flue.config.ts");
  const buildDir = join(import.meta.dir, "dist-web");

  let scratchDir: string;
  let flueServer: Bun.Subprocess;
  let web: WebServer;

  beforeAll(async () => {
    scratchDir = await mkdtemp(join(tmpdir(), "acd-web-e2e-scratch-"));
    await rm(buildDir, { recursive: true, force: true });

    const build = Bun.spawn(
      ["bunx", "--bun", "flue", "build", "--config", E2E_CONFIG, "--output", buildDir],
      { cwd: REPO_ROOT, stdout: "ignore", stderr: "pipe" },
    );
    if ((await build.exited) !== 0) {
      throw new Error(`flue build failed:\n${await new Response(build.stderr).text()}`);
    }

    flueServer = Bun.spawn(["bun", join(buildDir, "server.mjs")], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PORT: String(FLUE_PORT),
        ACD_TUTOR_SCRATCH_DIR: scratchDir,
      },
      stdout: "ignore",
      stderr: "inherit",
    });

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      try {
        if ((await fetch(`${FLUE_URL}/openapi.json`)).ok) break;
      } catch {
        // not up yet
      }
      await Bun.sleep(150);
    }

    web = startWebServer({
      client: createFlueClient({ baseUrl: FLUE_URL }),
      agents: [
        {
          id: "tutor-faux",
          label: "Faux Tutor",
          greeting: "Hello from the faux tutor!",
          actions: [{ label: "Check my work", message: "check please" }],
        },
      ],
      port: WEB_PORT,
      scratchDir,
    });
  }, 60_000);

  afterAll(async () => {
    web?.stop();
    flueServer?.kill();
    await rm(scratchDir, { recursive: true, force: true });
    await rm(buildDir, { recursive: true, force: true });
  });

  test("serves the client HTML at /", async () => {
    const res = await fetch(`${WEB_URL}/`);
    expect(res.ok).toBe(true);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("Code Buddy");
  });

  test("lists agents", async () => {
    const res = await fetch(`${WEB_URL}/api/agents`);
    const agents = (await res.json()) as Array<{ id: string }>;
    expect(agents.map((a) => a.id)).toContain("tutor-faux");
  });

  test("rejects sessions for unknown agents", async () => {
    const res = await fetch(`${WEB_URL}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: "nope" }),
    });
    expect(res.status).toBe(400);
  });

  // Fixed conversation id, the way the browser resumes from localStorage.
  const CONVERSATION_ID = "tutor-faux_e2e-conversation";

  test("streams a tutor reply over SSE and the tool call writes the lesson file", async () => {
    const created = await fetch(`${WEB_URL}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: "tutor-faux", instanceId: CONVERSATION_ID }),
    });
    expect(created.ok).toBe(true);
    const { sessionId } = (await created.json()) as { sessionId: string };
    expect(sessionId).toBe(CONVERSATION_ID);

    const res = await fetch(`${WEB_URL}/api/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "let's start" }),
    });
    expect(res.ok).toBe(true);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const raw = await res.text();
    const chunks = raw
      .split("\n\n")
      .filter((e) => e.startsWith("data: "))
      .map((e) => JSON.parse(e.slice(6)) as { kind: string; text?: string });

    const reply = chunks
      .filter((c) => c.kind === "text")
      .map((c) => c.text)
      .join("");
    expect(reply).toContain("Created your first lesson");
    expect(chunks.at(-1)?.kind).toBe("done");

    // The faux writeFile tool call landed in the shared scratch dir…
    const written = await readFile(join(scratchDir, "lesson-1.ts"), "utf8");
    expect(written).toContain("Lesson 1");

    // …and the web file API sees the same workspace, minus host bookkeeping
    // (the openFile signal is a dotfile, never listed as a lesson).
    const files = (await (await fetch(`${WEB_URL}/api/files`)).json()) as {
      files: string[];
    };
    expect(files.files).toContain("lesson-1.ts");
    expect(files.files).not.toContain(".open-request");

    const file = (await (
      await fetch(`${WEB_URL}/api/files/lesson-1.ts`)
    ).json()) as { content: string };
    expect(file.content).toContain("Lesson 1");
  }, 30_000);

  test("a reload-style session re-create resumes the same conversation and serves its history", async () => {
    // Same id again — what the client does on page reload with its stored id.
    const resumed = await fetch(`${WEB_URL}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: "tutor-faux", instanceId: CONVERSATION_ID }),
    });
    expect(((await resumed.json()) as { sessionId: string }).sessionId).toBe(
      CONVERSATION_ID,
    );

    // History comes from Flue's agent_end snapshot, not a client-side copy.
    const { messages } = (await (
      await fetch(`${WEB_URL}/api/sessions/${CONVERSATION_ID}/history`)
    ).json()) as { messages: Array<{ role: string; text: string }> };
    expect(messages).toEqual([
      { role: "user", text: "let's start" },
      { role: "tutor", text: "Created your first lesson — open lesson-1.ts to begin." },
    ]);

    // Unknown conversations just have no history.
    const empty = (await (
      await fetch(`${WEB_URL}/api/sessions/nope/history`)
    ).json()) as { messages: unknown[] };
    expect(empty.messages).toEqual([]);
  });

  test("rejects malformed instance ids", async () => {
    const res = await fetch(`${WEB_URL}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: "tutor-faux", instanceId: "../etc" }),
    });
    expect(res.status).toBe(400);
  });

  test("the tutor's openFile call surfaces as a consumable open request", async () => {
    // The faux script called openFile(lesson-1.ts) during the previous test's
    // reply; web mode means no editor was spawned — just this signal.
    const first = (await (await fetch(`${WEB_URL}/api/open-request`)).json()) as {
      filename: string | null;
    };
    expect(first.filename).toBe("lesson-1.ts");

    // Consume-on-read: a second take returns nothing.
    const second = (await (await fetch(`${WEB_URL}/api/open-request`)).json()) as {
      filename: string | null;
    };
    expect(second.filename).toBeNull();
  });

  test("autosave PUT writes through to the scratch dir the agent reads", async () => {
    const content = "// student work\nconst x = 1; // ok\n";
    const res = await fetch(`${WEB_URL}/api/files/lesson-1.ts`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    expect(res.ok).toBe(true);
    expect(await readFile(join(scratchDir, "lesson-1.ts"), "utf8")).toBe(content);
  });

  test("DELETE /api/files wipes the workspace (start from scratch)", async () => {
    const res = await fetch(`${WEB_URL}/api/files`, { method: "DELETE" });
    expect(res.ok).toBe(true);
    const { files } = (await (await fetch(`${WEB_URL}/api/files`)).json()) as {
      files: string[];
    };
    expect(files).toEqual([]);
  });

  test("blocks path traversal in file names", async () => {
    const res = await fetch(
      `${WEB_URL}/api/files/${encodeURIComponent("../escape.ts")}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "nope" }),
      },
    );
    expect(res.ok).toBe(true); // basename()d into the scratch dir…
    const files = (await (await fetch(`${WEB_URL}/api/files`)).json()) as {
      files: string[];
    };
    expect(files.files).toContain("escape.ts"); // …not written outside it
  });
});
