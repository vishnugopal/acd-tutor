import type { AgentInfo, ReplyChunk } from "./types";

/**
 * Thin client for the web server's API (src/web/server.ts). All tutor
 * behavior — conversations, lesson feedback, file creation — comes from the
 * Flue server through these calls; nothing is scripted client-side.
 */

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function fetchAgents(): Promise<AgentInfo[]> {
  return fetch("/api/agents").then((r) => asJson<AgentInfo[]>(r));
}

/**
 * Creates a session, or resumes a prior conversation when `instanceId` (from
 * localStorage) is provided — Flue's memory is keyed by it server-side.
 */
export async function createSession(
  agent: string,
  instanceId?: string,
): Promise<string> {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, instanceId }),
  });
  const { sessionId } = await asJson<{ sessionId: string }>(res);
  return sessionId;
}

/** Conversation history (Flue's latest snapshot) for transcript restore. */
export async function fetchHistory(
  sessionId: string,
): Promise<Array<{ role: "user" | "tutor"; text: string }>> {
  const { messages } = await fetch(
    `/api/sessions/${sessionId}/history`,
  ).then((r) => asJson<{ messages: Array<{ role: "user" | "tutor"; text: string }> }>(r));
  return messages;
}

/**
 * Sends one message and yields the tutor's reply chunks as they stream in
 * (SSE over fetch). Terminates on the server's `done` event; a server-side
 * `error` event becomes a thrown Error.
 */
export async function* streamReply(
  sessionId: string,
  message: string,
): AsyncGenerator<ReplyChunk> {
  const res = await fetch(`/api/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok || !res.body) throw new Error(`Send failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = JSON.parse(line.slice(6)) as
          | ReplyChunk
          | { kind: "done" }
          | { kind: "error"; text: string };
        if (payload.kind === "done") return;
        if (payload.kind === "error") throw new Error(payload.text);
        yield payload;
      }
    }
  }
}

/* Lesson-file APIs are per-agent: each tutor has its own workspace
   (acd-tutor → .ts lessons, argumentative-essay-tutor → .md lessons). */

const filesBase = (agentId: string) =>
  `/api/agents/${encodeURIComponent(agentId)}/files`;

/** "Start from scratch": wipe the lesson workspace (tutor restarts at lesson 1). */
export async function clearLessonFiles(agentId: string): Promise<void> {
  const res = await fetch(filesBase(agentId), { method: "DELETE" });
  await asJson<{ ok: boolean }>(res);
}

export async function listLessonFiles(agentId: string): Promise<string[]> {
  const { files } = await fetch(filesBase(agentId)).then((r) =>
    asJson<{ files: string[] }>(r),
  );
  return files;
}

export async function readLessonFile(
  agentId: string,
  name: string,
): Promise<string | null> {
  const res = await fetch(`${filesBase(agentId)}/${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  const { content } = await asJson<{ content: string }>(res);
  return content;
}

/**
 * Consumes the agent's pending openFile request, if any — the web-mode
 * equivalent of the tutor popping the file open in a local editor.
 */
export async function takeOpenRequest(agentId: string): Promise<string | null> {
  const { filename } = await fetch(
    `/api/agents/${encodeURIComponent(agentId)}/open-request`,
  ).then((r) => asJson<{ filename: string | null }>(r));
  return filename;
}

/** Autosave: same semantics as the agent's writeFile tool (create/overwrite). */
export async function writeLessonFile(
  agentId: string,
  name: string,
  content: string,
): Promise<void> {
  const res = await fetch(`${filesBase(agentId)}/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  await asJson<{ ok: boolean }>(res);
}
