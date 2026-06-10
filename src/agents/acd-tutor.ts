import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import { local } from "@flue/runtime/node";
import { acdProfile } from "./profiles/acd-tutor";

/**
 * Exporting this middleware opts the agent into the HTTP transport at
 * POST /agents/acd-tutor/:id (used by the CLI in src/main.ts via @flue/sdk).
 */
export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  profile: acdProfile,
  model: "anthropic/claude-sonnet-4-6",
  sandbox: local(),
  cwd: process.cwd(),
}));
