import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import { local } from "@flue/runtime/node";
import { stratifiedDesignProfile } from "./profiles/stratified-design-tutor";

/**
 * Exporting this middleware opts the agent into the HTTP transport at
 * POST /agents/stratified-design-tutor/:id.
 */
export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  profile: stratifiedDesignProfile,
  model: "anthropic/claude-sonnet-4-6",
  sandbox: local(),
  cwd: process.cwd(),
}));
