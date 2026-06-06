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

**How to apply:** Forward individual vars: `sandbox: local({ env: { EDITOR: process.env.EDITOR } })` (see `src/agents/main.ts`). Never use `local({ env: { ...process.env } })` — it exposes all host secrets. Related: [[flue-src-app-ts-reserved]].
