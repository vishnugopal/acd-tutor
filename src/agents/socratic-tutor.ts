import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import { local } from "@flue/runtime/node";
import { socraticProfile } from "./profiles/socratic-tutor";

/**
 * Exporting this middleware opts the agent into the HTTP transport at
 * POST /agents/socratic-tutor/:id (used by the CLI in src/main.ts via @flue/sdk).
 */
export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  profile: socraticProfile,
  model: "anthropic/claude-sonnet-4-6",
  sandbox: local(),
  cwd: process.cwd(),
}));
