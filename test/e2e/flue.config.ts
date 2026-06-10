import { defineConfig } from "@flue/cli/config";

/**
 * Build config for the end-to-end test only. `root` defaults to this file's
 * directory (test/e2e), so Flue discovers agents under test/e2e/agents/ — the
 * faux `tutor-faux` agent lives there and never enters the production build,
 * which uses the repo-root flue.config.ts (agents under src/agents/).
 */
export default defineConfig({
  target: "node",
});
