import type { AgentAction, AgentPresentation } from "../../shared/catalog";
import type { AgentChunk } from "../../shared/chunks";

export type { AgentAction };

/** Agent metadata served by GET /api/agents (the shared wire shape). */
export type AgentInfo = AgentPresentation;

/** One streamed chunk of a tutor reply (the shared chunk vocabulary). */
export type ReplyChunk = AgentChunk;

export type ChatRole = "user" | "tutor" | "info" | "debug";

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
}

export type MascotMood = "idle" | "cheer" | "think";

export type Screen = { name: "home" } | { name: "lesson"; agent: AgentInfo };
