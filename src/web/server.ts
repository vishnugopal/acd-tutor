import type { FlueClient } from "@flue/sdk";
import { createAgentSession, type AgentChunk, type AgentSession } from "../agent-io";
import type { AgentChoice } from "../console/types";
import { createLessonFileStore, type LessonFileStore } from "./files";
import { appendTurn, type TranscriptMessage } from "./history";
import indexPage from "./client/index.html";

/**
 * The browser-facing server: serves the React client (Bun bundles the HTML
 * import, with HMR in dev) and exposes a small JSON/SSE API that mirrors the
 * console runner's wiring — agent sessions stream AgentChunks, and the lesson
 * files the agent's tools manage are readable/writable for the editor.
 *
 * No authentication: single learner on localhost, same trust model as the
 * console runner.
 */

export interface WebServerOptions {
  client: FlueClient;
  agents: AgentChoice[];
  /** Lesson-file workspace per agent id (agents without one are chat-only). */
  workspaces?: Record<string, string>;
  port?: number;
}

export interface WebServer {
  url: string;
  stop(): void;
}

/**
 * SSE wire format: one `data: <json AgentChunk>` event per chunk, then `done`.
 * A comment heartbeat keeps the connection alive through long tool-heavy
 * stretches where the agent produces no chunks (SSE comments are ignored by
 * the client parser).
 */
function sseReply(chunks: AsyncIterable<AgentChunk>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);
      try {
        for await (const chunk of chunks) emit(chunk);
        emit({ kind: "done" });
      } catch (err) {
        emit({ kind: "error", text: err instanceof Error ? err.message : String(err) });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

const badRequest = (message: string) =>
  Response.json({ error: message }, { status: 400 });
const notFound = (message: string) =>
  Response.json({ error: message }, { status: 404 });

export function startWebServer(options: WebServerOptions): WebServer {
  const { client, agents, port = 3790 } = options;

  // One lesson-file store per agent workspace (e.g. acd-tutor → .ts lessons,
  // argumentative-essay-tutor → .md lessons).
  const stores = new Map<string, LessonFileStore>(
    Object.entries(options.workspaces ?? {}).map(([agentId, dir]) => [
      agentId,
      createLessonFileStore(dir),
    ]),
  );
  const storeFor = (agentId: string) => stores.get(agentId) ?? null;

  // Sessions are in-memory and per-server-lifetime, like a console run.
  // Conversation memory itself lives Flue-server-side on the instance id.
  const sessions = new Map<string, AgentSession>();

  // Conversation transcript per instance, served back for page reloads.
  // Flue's `agent_end` reports only each run's new messages (not the whole
  // conversation), so we accumulate turns here rather than overwriting — see
  // appendTurn. In-memory and per-server-lifetime, like a console run.
  const histories = new Map<string, TranscriptMessage[]>();

  const openSession = (agentId: string, instanceId: string): AgentSession =>
    createAgentSession(client, agentId, instanceId, {
      onEvent: (event) => {
        if (event.type === "agent_end") {
          histories.set(
            instanceId,
            appendTurn(histories.get(instanceId) ?? [], event.messages),
          );
        }
      },
    });

  const server = Bun.serve({
    port,
    // Agent turns can stay quiet for a while mid-tools; the SSE heartbeat
    // ticks every 15s, so anything comfortably above that works.
    idleTimeout: 120,
    routes: {
      "/": indexPage,

      "/api/agents": {
        GET: () => Response.json(agents),
      },

      "/api/sessions": {
        POST: async (req) => {
          const body = (await req.json().catch(() => null)) as {
            agent?: string;
            instanceId?: string;
          } | null;
          const agentId = body?.agent;
          if (!agentId || !agents.some((a) => a.id === agentId)) {
            return badRequest("Unknown agent");
          }
          // The client may resume a prior conversation by sending back the
          // instance id it stored (localStorage) — Flue's conversation memory
          // is keyed by it server-side. Sessions are keyed by it here too.
          const requested = body?.instanceId;
          if (requested !== undefined && !/^[\w-]{1,128}$/.test(requested)) {
            return badRequest("Invalid instanceId");
          }
          const instanceId = requested ?? `${agentId}_${crypto.randomUUID()}`;
          if (!sessions.has(instanceId)) {
            sessions.set(instanceId, openSession(agentId, instanceId));
          }
          return Response.json({ sessionId: instanceId, instanceId });
        },
      },

      // Conversation history for a reload: the turns accumulated so far.
      "/api/sessions/:id/history": {
        GET: (req) =>
          Response.json({ messages: histories.get(req.params.id) ?? [] }),
      },

      "/api/sessions/:id/messages": {
        POST: async (req) => {
          const session = sessions.get(req.params.id);
          if (!session) return notFound("Unknown session");
          const body = (await req.json().catch(() => null)) as {
            message?: string;
          } | null;
          const message = body?.message?.trim();
          if (!message) return badRequest("Empty message");
          return sseReply(session.send({ message }));
        },
      },

      "/api/agents/:agent/files": {
        GET: async (req) => {
          const files = storeFor(req.params.agent);
          if (!files) return notFound("No workspace for this agent");
          return Response.json({ files: await files.list() });
        },
        // "Start from scratch": wipe the workspace so the tutor's listFiles
        // sees a fresh learner and begins again at lesson 1.
        DELETE: async (req) => {
          const files = storeFor(req.params.agent);
          if (!files) return notFound("No workspace for this agent");
          await files.clear();
          return Response.json({ ok: true });
        },
      },

      // The agent's openFile tool (web mode) leaves an open request; the
      // client polls this after each reply. Consume-on-read: the web editor
      // is the single consumer.
      "/api/agents/:agent/open-request": {
        GET: async (req) => {
          const files = storeFor(req.params.agent);
          if (!files) return notFound("No workspace for this agent");
          return Response.json({ filename: await files.takeOpenRequest() });
        },
      },

      "/api/agents/:agent/files/:name": {
        GET: async (req) => {
          const files = storeFor(req.params.agent);
          if (!files) return notFound("No workspace for this agent");
          const name = decodeURIComponent(req.params.name);
          const content = await files.read(name);
          if (content === null) return notFound("File not found");
          return Response.json({ name, content });
        },
        // Autosave endpoint — same shape as the agent's writeFile tool.
        PUT: async (req) => {
          const files = storeFor(req.params.agent);
          if (!files) return notFound("No workspace for this agent");
          const name = decodeURIComponent(req.params.name);
          const body = (await req.json().catch(() => null)) as {
            content?: string;
          } | null;
          if (typeof body?.content !== "string") {
            return badRequest("Missing content");
          }
          await files.write(name, body.content);
          return Response.json({ ok: true, name });
        },
      },
    },
  });

  return {
    url: server.url.toString(),
    stop: () => server.stop(true),
  };
}
