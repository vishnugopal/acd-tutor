import type { AgentChunk, AgentDiagram } from "../types/chunks";

/**
 * The reply-stream fold, shared by the console and web send loops: pure
 * calculations over the in-flight reply. A visible debug line flushes the
 * accumulated prose first so the transcript stays chronological; hidden
 * debug lines fold away entirely.
 */

/** A transcript entry the fold emits (frontends add their own ids/roles). */
export interface FoldedMessage {
  role: "tutor" | "debug" | "info" | "diagram";
  text?: string;
  diagram?: AgentDiagram;
}

/** In-flight reply state folded over the chunk stream (data). */
export interface StreamState {
  /** Prose accumulated since the last flush to the transcript. */
  text: string;
  /** True once any prose has been flushed (a debug line landed mid-reply). */
  replied: boolean;
}

export const initialStreamState: StreamState = { text: "", replied: false };

/**
 * Folds one chunk into the reply state (calculation). A visible debug line
 * flushes the accumulated prose first so the transcript stays chronological
 * (e.g. a tool call lands after the prose that preceded it); hidden debug
 * lines fold away entirely.
 */
export function foldChunk(
  state: StreamState,
  chunk: AgentChunk,
  debugMode: boolean,
): { state: StreamState; append: FoldedMessage[] } {
  const flushText = (): FoldedMessage[] =>
    state.text === "" ? [] : [{ role: "tutor", text: state.text }];

  if (chunk.kind === "debug") {
    if (!debugMode) return { state, append: [] };
    return {
      state: { text: "", replied: state.replied || state.text !== "" },
      append: [...flushText(), { role: "debug", text: chunk.text }],
    };
  }
  if (chunk.kind === "diagram") {
    return {
      state: { text: "", replied: true },
      append: [...flushText(), { role: "diagram", diagram: chunk.diagram }],
    };
  }
  return {
    state: { ...state, text: state.text + chunk.text },
    append: [],
  };
}

/** Transcript entries owed when the stream ends cleanly (calculation). */
export function finishStream(
  state: StreamState,
  emptyReplyMessage: string,
): FoldedMessage[] {
  if (state.text !== "") return [{ role: "tutor", text: state.text }];
  return state.replied ? [] : [{ role: "info", text: emptyReplyMessage }];
}
