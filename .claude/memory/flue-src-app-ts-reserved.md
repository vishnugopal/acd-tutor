---
name: flue-src-app-ts-reserved
description: "In Flue projects, src/app.ts is a reserved entry file — don't place arbitrary code there"
metadata: 
  node_type: memory
  type: project
  originSessionId: 68ff0e5e-9b62-41d9-8f77-3ad2778bf317
---

In Flue (@flue/cli), `src/app.ts` is a reserved convention: if present, `flue build` imports its **default export** as a user-supplied Hono app (must have a `fetch(request, env, ctx)` method) and the build fails with MISSING_EXPORT otherwise. Flue also scans `src/agents/` and `src/workflows/` for agent files.

**Why:** Placing the acd-tutor CLI at `src/app.ts` broke `flue build` (2026-06-05); renamed to `src/main.ts` per user.

**How to apply:** In any Flue project, keep non-Flue entry points out of the reserved names — use `src/main.ts`, `src/cli.ts`, etc.
