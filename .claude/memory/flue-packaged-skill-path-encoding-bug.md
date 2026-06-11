---
name: flue-packaged-skill-path-encoding-bug
description: flue runtime advertises packaged-skill resource paths %3A-encoded but the model reads them with literal colons; patched
metadata: 
  node_type: memory
  type: project
  originSessionId: 5c9614fa-e10f-4495-ad50-e3daa95ace3a
---

`@flue/runtime` (through at least 0.11.0) advertises packaged-skill resource paths
via `encodeURIComponent(skillId)`, so a skill id like `skill:socratic-tutor:<hash>`
becomes `skill%3Asocratic-tutor%3A<hash>` in the path. But `readPackagedSkillFile`
does an exact string compare. Tutor models reliably normalize `%3A` back to `:` when
reproducing the path, so reads of `references/*.md` fail with
`[flue] Packaged skill file not found: ...`. Affected all three skills (socratic-tutor,
acd-tutor, argumentative-essay-tutor) since each links references in SKILL.md.

**Why:** the encode (advertise) and decode (model behavior) are mismatched; the lookup
is not encoding-tolerant.

**How to apply:** fixed via `bun patch @flue/runtime` — `readPackagedSkillFile` now matches
the encoded path, the raw-colon path, AND `decodeURIComponent(path)`. Patch lives at
`patches/@flue%2Fruntime@0.9.2.patch`, registered in package.json `patchedDependencies`;
reapplied automatically on `bun install`. `dist/server.mjs` externalizes `@flue/runtime`,
so the patch covers both from-source runs and the built artifact.

**Stay on flue 0.9.2 with Bun 1.3.14.** 0.11.0 statically imports `node:sqlite`
(in `@flue/runtime/node`, pulled in by `local()`) for its run/event store; Bun 1.3.14 has
no `node:sqlite` built-in, so the server crashes at load with
`No such built-in module: node:sqlite`. Upgrading flue is blocked until Bun ships
`node:sqlite` (or flue offers a non-sqlite store). The upstream packaged-skill lookup was
byte-identical 0.9.2 → 0.11.0, so the upgrade never fixed the path bug anyway — only the
patch does. If flue is ever upgraded, re-create the patch against the new version.
Relates to [[flue-src-app-ts-reserved]] and [[flue-local-sandbox-env-allowlist]].
