import { createAgent, type AgentRouteHandler } from "@flue/runtime";
import { local } from "@flue/runtime/node";
import { createLessonFileTools } from "../../../src/tools";
import { registerFauxTutorProvider } from "../../support/faux-tutor";

/**
 * Test-only tutor backed by a scripted (faux) model so the end-to-end suite
 * runs deterministically and offline. It lives under this e2e-only Flue project
 * (test/e2e), discovered solely by test/e2e/flue.config.ts, so it never ships
 * in the production build; `main` stays free of test wiring.
 *
 * Unlike `main`, this agent doesn't load the ACD skill: imported skills must
 * sit inside the build root, and a scripted model ignores instructions anyway.
 * It only needs the lesson-file tools so the scripted writeFile call executes.
 */
const scratchDir = process.env.ACD_TUTOR_SCRATCH_DIR ?? "/tmp/acd-tutor/scratch";
const model = registerFauxTutorProvider();

export const route: AgentRouteHandler = (_c, next) => next();

export default createAgent(() => ({
  model,
  instructions: "Faux ACD tutor used by the end-to-end test.",
  tools: createLessonFileTools({ scratchDir }),
  sandbox: local(),
  cwd: process.cwd(),
}));
