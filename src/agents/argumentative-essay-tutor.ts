import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import { local } from "@flue/runtime/node";
import { essayProfile } from "./profiles/argumentative-essay-tutor";

/**
 * Exporting this middleware opts the agent into the HTTP transport at
 * POST /agents/argumentative-essay-tutor/:id (used by the runners via @flue/sdk).
 */
export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  profile: essayProfile,
  model: "anthropic/claude-sonnet-4-6",
  sandbox: local(),
  cwd: process.cwd(),
}));
