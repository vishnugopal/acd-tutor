import type { AgentAction, AgentPresentation } from "../agents/catalog/catalog";
import type { AgentChunk, AgentDiagram } from "../agents/types/chunks";

/** A persistent button rendered above the input line; pressing it sends `message`. */
export type ConsoleAction = AgentAction;

/** One streamed chunk of a reply: prose, or a diagnostic line. */
export type ReplyChunk = AgentChunk;

/**
 * One selectable agent. The console renders these in a startup menu and stays
 * agnostic about what they are — `id` is an opaque handle passed back to
 * `createReply`, and the presentation fields drive the chat once chosen.
 */
export type AgentChoice = AgentPresentation;

export interface ConsoleOptions {
  /** Agents offered at startup (≥1). A single agent skips the menu. */
  agents: AgentChoice[];
  /** Builds the reply source for the chosen agent's id. */
  createReply: (id: string) => (line: string) => AsyncIterable<ReplyChunk>;
  /**
   * Resolves the current action buttons for the chosen agent.
   * Workbook agents can return Start while their workspace is empty.
   */
  resolveActions?: (
    agent: AgentChoice,
  ) => Promise<ConsoleAction[]> | ConsoleAction[];
  /** Shown when a reply yields no text. */
  emptyReplyMessage?: string;
  /** Indicator shown while waiting for the first reply chunk. */
  thinkingIndicator?: string;
  /** Formats a reply error for display. */
  formatError?: (err: unknown) => string;
}

/** One completed transcript entry. */
export interface Message {
  role: "user" | "tutor" | "error" | "info" | "debug" | "diagram";
  text?: string;
  diagram?: AgentDiagram;
}
