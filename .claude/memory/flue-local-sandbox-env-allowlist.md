---
name: flue-local-sandbox-env-allowlist
description: "Flue's local() sandbox only exposes an explicit env allowlist — host vars like $EDITOR must be forwarded via local({ env: {...} })"
metadata: 
  node_type: memory
  type: project
  originSessionId: 8ba0ac67-efd6-4829-b5ce-ffd8d2f7b09f
---

Flue's `local()` sandbox (`@flue/runtime/node`) does NOT inherit the host process env. It exposes only `DEFAULT_LOCAL_ENV_ALLOWLIST` plus whatever you pass in `local({ env: { ... } })`. So `$EDITOR` (and similar host vars) are empty inside the agent's bash tool unless forwarded explicitly.

**Why:** The acd-tutor skill's `${EDITOR:-...} file &` silently fell back to the default because `EDITOR` never reached the sandbox (discovered 2026-06-06). Pass-through is intentionally explicit to avoid leaking host secrets to the model's bash tool.

**How to apply:** Forward individual vars: `sandbox: local({ env: { EDITOR: process.env.EDITOR } })`. Never use `local({ env: { ...process.env } })` — it exposes all host secrets. Often better: skip the sandbox entirely and wrap the host-env-dependent behavior in a custom tool via `defineTool` — Flue tool handlers execute in the host server process, where `process.env` is fully available (acd-tutor moved its $EDITOR usage into `src/tools.ts` this way, 2026-06-06). Related: [[flue-src-app-ts-reserved]].
