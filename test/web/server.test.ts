import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { FlueClient } from "@flue/sdk";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startWebServer, type WebServer } from "../../src/web/server";

/**
 * Request-validation tests for the web server's JSON API. No Flue server is
 * involved: every request here is rejected (or satisfied) before the agent
 * client would be touched, so a stub FlueClient suffices. The streaming
 * happy path is covered by test/e2e/web.e2e.test.ts.
 */
describe("web server request validation", () => {
  let scratchDir: string;
  let web: WebServer;
  let base: string;

  beforeAll(async () => {
    scratchDir = await mkdtemp(join(tmpdir(), "acd-web-validate-"));
    web = startWebServer({
      client: {} as FlueClient,
      agents: [{ id: "test-agent", label: "Test Agent" }],
      workspaces: { "test-agent": scratchDir },
      port: 0,
    });
    base = web.url.replace(/\/$/, "");
  });

  afterAll(async () => {
    web?.stop();
    await rm(scratchDir, { recursive: true, force: true });
  });

  const post = (path: string, body: string) =>
    fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

  describe("POST /api/sessions", () => {
    test("unparsable JSON → 400", async () => {
      expect((await post("/api/sessions", "{not json")).status).toBe(400);
    });

    test("non-object body → 400", async () => {
      expect((await post("/api/sessions", "5")).status).toBe(400);
      expect((await post("/api/sessions", "null")).status).toBe(400);
    });

    test("agent of the wrong type → 400", async () => {
      expect(
        (await post("/api/sessions", JSON.stringify({ agent: 7 }))).status,
      ).toBe(400);
    });

    test("instanceId of the wrong type → 400", async () => {
      expect(
        (
          await post(
            "/api/sessions",
            JSON.stringify({ agent: "test-agent", instanceId: 42 }),
          )
        ).status,
      ).toBe(400);
    });

    test("malformed instanceId → 400", async () => {
      expect(
        (
          await post(
            "/api/sessions",
            JSON.stringify({ agent: "test-agent", instanceId: "../etc" }),
          )
        ).status,
      ).toBe(400);
    });

    test("unknown agent → 400", async () => {
      expect(
        (await post("/api/sessions", JSON.stringify({ agent: "nope" }))).status,
      ).toBe(400);
    });

    test("valid body → 200 with a session id", async () => {
      const res = await post(
        "/api/sessions",
        JSON.stringify({ agent: "test-agent" }),
      );
      expect(res.status).toBe(200);
      const { sessionId } = (await res.json()) as { sessionId: string };
      expect(sessionId).toStartWith("test-agent_");
    });
  });

  describe("POST /api/sessions/:id/messages", () => {
    let sessionId: string;

    beforeAll(async () => {
      const res = await post(
        "/api/sessions",
        JSON.stringify({ agent: "test-agent" }),
      );
      ({ sessionId } = (await res.json()) as { sessionId: string });
    });

    test("unknown session → 404", async () => {
      expect(
        (await post("/api/sessions/nope/messages", JSON.stringify({ message: "hi" })))
          .status,
      ).toBe(404);
    });

    test("unparsable JSON → 400", async () => {
      expect(
        (await post(`/api/sessions/${sessionId}/messages`, "{oops")).status,
      ).toBe(400);
    });

    test("message of the wrong type → 400", async () => {
      expect(
        (
          await post(
            `/api/sessions/${sessionId}/messages`,
            JSON.stringify({ message: 5 }),
          )
        ).status,
      ).toBe(400);
    });

    test("blank message → 400", async () => {
      expect(
        (
          await post(
            `/api/sessions/${sessionId}/messages`,
            JSON.stringify({ message: "   " }),
          )
        ).status,
      ).toBe(400);
    });
  });

  describe("PUT /api/agents/:agent/files/:name", () => {
    const put = (body: string) =>
      fetch(`${base}/api/agents/test-agent/files/lesson-1.ts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      });

    test("unparsable JSON → 400", async () => {
      expect((await put("{oops")).status).toBe(400);
    });

    test("content of the wrong type → 400", async () => {
      expect((await put(JSON.stringify({ content: 42 }))).status).toBe(400);
      expect((await put(JSON.stringify({}))).status).toBe(400);
    });

    test("valid content → 200", async () => {
      expect((await put(JSON.stringify({ content: "ok" }))).status).toBe(200);
    });
  });

  describe("session cap", () => {
    test("creating sessions beyond the cap evicts the oldest", async () => {
      const idFor = (n: number) => `test-agent_cap-${n}`;
      // The cap is 100; the suite has already created a couple of sessions,
      // so 110 more guarantees the first capped one is evicted.
      for (let n = 0; n < 110; n++) {
        const res = await post(
          "/api/sessions",
          JSON.stringify({ agent: "test-agent", instanceId: idFor(n) }),
        );
        expect(res.status).toBe(200);
      }
      // The oldest capped session fell out of the map → 404 before any agent
      // I/O. The newest survives the cap (400 = body reached validation is
      // impossible here; a live session only fails later, at agent I/O).
      const evicted = await post(
        `/api/sessions/${idFor(0)}/messages`,
        JSON.stringify({ message: "hi" }),
      );
      expect(evicted.status).toBe(404);
    });
  });
});
