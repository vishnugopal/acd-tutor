import type { AgentAction, AgentPresentation } from "../../agents/catalog/catalog";
import type { AgentChunk, AgentDiagram } from "../../agents/types/chunks";

export type { AgentAction };

/** Agent metadata served by GET /api/agents (the shared wire shape). */
export type AgentInfo = AgentPresentation;

/** One streamed chunk of a tutor reply (the shared chunk vocabulary). */
export type ReplyChunk = AgentChunk;

export type ChatRole = "user" | "tutor" | "info" | "debug" | "diagram";

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text?: string;
  diagram?: AgentDiagram;
}

export type MascotMood = "idle" | "cheer" | "think";

export type Screen = { name: "home" } | { name: "lesson"; agent: AgentInfo };
