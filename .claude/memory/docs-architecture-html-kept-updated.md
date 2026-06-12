---
name: docs-architecture-html-kept-updated
description: docs/architecture.html (NODES/EDGES interactive diagram) must be updated alongside AGENTS.md when module structure changes
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2e9ec15c-a7ba-43a7-abc6-2ef5c39abe41
---

When a change moves code between modules or adds a module, the user expects `docs/architecture.html` to be updated as part of the plan/change, not just AGENTS.md.

**Why:** The user rejected a plan that updated AGENTS.md but not docs/architecture; they asked for the architecture doc to be part of the plan.

**How to apply:** `docs/architecture.html` is an interactive diagram driven by `NODES` and `EDGES` JS arrays inside the HTML. New modules get a node entry (id, label, path, worlds, kind, concerns, x/y, summary, points, tests) and import edges; moved/changed modules get their node summary/points/tests revised. Shared-layer nodes sit at y≈955.
