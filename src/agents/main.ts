import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import socraticTutor from "../skills/socratic-tutor/SKILL.md" with { type: "skill" };

// Exporting this middleware opts the agent into the HTTP transport at
// POST /agents/main/:id (used by the CLI in app.ts via @flue/sdk).
export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  model: "anthropic/claude-sonnet-4-6",
  instructions: "You are a socratic tutor",
  skills: [socraticTutor],
}));
