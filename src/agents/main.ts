import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import { local } from "@flue/runtime/node";
import { tutorProfile } from "../tutor-agent-profile";

/**
 * Exporting this middleware opts the agent into the HTTP transport at
 * POST /agents/main/:id (used by the CLI in src/main.ts via @flue/sdk).
 */
export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  profile: tutorProfile,
  model: "anthropic/claude-sonnet-4-6",
  sandbox: local(),
  cwd: process.cwd(),
}));
