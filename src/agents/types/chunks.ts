/**
 * The streaming chunk vocabulary shared by every layer: agent-io yields
 * AgentChunks, the web server frames them as StreamFrames over SSE, and the
 * browser parses them back. Layer 0: pure data + calculations.
 */

/** A rendered diagram emitted by a tutor. */
export interface AgentDiagram {
  title: string;
  caption: string;
  altText: string;
  mermaid: string;
  svg?: string;
  terminal?: string;
}

/** One streamed chunk of an agent reply. */
export type AgentChunk =
  /** Reply prose, streamed as deltas. */
  | { kind: "text"; text: string }
  /** One formatted diagnostic line (tool calls, turns, logs, …). */
  | { kind: "debug"; text: string }
  /** One structured diagram, rendered outside the markdown pipeline. */
  | { kind: "diagram"; diagram: AgentDiagram };

/** One SSE frame on the wire: a chunk, or the stream's terminal event. */
export type StreamFrame =
  | AgentChunk
  | { kind: "done" }
  | { kind: "error"; text: string };

/**
 * Parses one SSE `data:` payload into a StreamFrame, or null for anything
 * malformed (bad JSON, wrong shape) — skip, don't crash the stream.
 */
export function parseStreamFrame(raw: string): StreamFrame | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  const frame = value as { kind?: unknown; text?: unknown; diagram?: unknown };
  switch (frame.kind) {
    case "text":
    case "debug":
    case "error":
      return typeof frame.text === "string"
        ? { kind: frame.kind, text: frame.text }
        : null;
    case "done":
      return { kind: "done" };
    case "diagram":
      return isAgentDiagram(frame.diagram)
        ? { kind: "diagram", diagram: frame.diagram }
        : null;
    default:
      return null;
  }
}

const isString = (value: unknown): value is string => typeof value === "string";

function isAgentDiagram(value: unknown): value is AgentDiagram {
  if (value === null || typeof value !== "object") return false;
  const diagram = value as Partial<Record<keyof AgentDiagram, unknown>>;
  return (
    isString(diagram.title) &&
    isString(diagram.caption) &&
    isString(diagram.altText) &&
    isString(diagram.mermaid) &&
    (diagram.svg === undefined || isString(diagram.svg)) &&
    (diagram.terminal === undefined || isString(diagram.terminal))
  );
}
