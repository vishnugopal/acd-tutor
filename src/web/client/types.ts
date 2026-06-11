/** Action button surfaced by an agent (e.g. "Check my work"). */
export interface AgentAction {
  label: string;
  message: string;
}

/** Agent metadata served by GET /api/agents (mirrors AgentChoice). */
export interface AgentInfo {
  id: string;
  label: string;
  description?: string;
  greeting?: string;
  farewell?: string;
  actions?: AgentAction[];
}

/** One streamed chunk of a tutor reply (mirrors AgentChunk on the server). */
export interface ReplyChunk {
  kind: "text" | "debug";
  text: string;
}

export type ChatRole = "user" | "tutor" | "info";

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
}

export type MascotMood = "idle" | "cheer" | "think";

export type Screen = { name: "home" } | { name: "lesson"; agent: AgentInfo };
