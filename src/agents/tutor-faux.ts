import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import { local } from "@flue/runtime/node";
import { registerFauxTutorProvider } from "../../test/support/faux-tutor";
import { tutorProfile } from "../tutor-agent-profile";

/**
 * Test-only tutor: the same profile (skills, tools, instructions) as the real
 * `main` agent, but backed by a scripted (faux) model so the end-to-end suite
 * (test/e2e) runs deterministically and offline. The faux provider setup
 * lives in test/support; this file is just the addressable-agent shim
 * Flue requires under src/agents/. Production `main` stays free of test wiring.
 */
const model = registerFauxTutorProvider();

export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  profile: tutorProfile,
  model,
  sandbox: local(),
  cwd: process.cwd(),
}));
