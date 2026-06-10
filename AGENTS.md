This is an agentic tutor. Helps teach concepts and guides users to a solution.

## Runtime: Bun (not Node.js)

This project uses Bun exclusively:

- `bun <file>` / `bun run <script>` / `bun install` / `bun test` / `bunx <pkg>` — instead of node, npm/yarn/pnpm, jest/vitest, npx
- Prefer Bun built-ins over npm packages: `Bun.serve()` (not express), `Bun.spawn`/`Bun.$` (not execa), `Bun.file` (not node:fs), `bun:sqlite`, built-in `WebSocket`
- Bun auto-loads `.env` — don't use dotenv

## Commands

```bash
bun install            # install dependencies
bun start              # run the tutor CLI (builds + starts server + REPL)
bunx tsc --noEmit      # typecheck
bunx --bun flue build  # build the agent bundle only (output: dist/server.mjs)
bun test               # run the unit suite (fast; e2e auto-skipped)
bun run test:e2e       # run the faux-model end-to-end test (builds + spawns a server)
```

The `ANTHROPIC_API_KEY` lives in `.env` (loaded by flue).

## Testing

Tests use `bun test` and live in `test/`, mirroring the `src/` layout
(e.g. `src/agent-io.ts` → `test/agent-io.test.ts`,
`src/console/TextInput.tsx` → `test/console/TextInput.test.ts`). They are
unit tests — each function in isolation. Shared test helpers live in
`test/support/`; synthetic data builders in `test/fixtures/`.

- **Reaching module-private functions**: pure helpers that aren't exported (e.g.
  `truncate`/`formatDebugEvent`, `wordStart`/`wordEnd`, `resolveLessonPath`) are
  exposed via a `__test__` export gated on `process.env.NODE_ENV === "test"`
  (Bun sets this automatically under `bun test`), so production stays private.
  Tests unwrap it: `const { truncate } = __test__!`.
- **End-to-end** (`test/e2e/`): gated behind `RUN_E2E` (it runs `flue build`
  and spawns a server, so it's skipped by default). It drives the `tutor-faux`
  agent — the real server + tools + streaming against a scripted faux model
  (`test/support/faux-tutor.ts`), no Anthropic key needed. The faux agent is its
  own Flue project (`test/e2e/agents/` + `test/e2e/flue.config.ts`), built with
  that config into `test/e2e/dist/`, so it never enters the production build —
  `flue build` at the repo root sees only `src/agents/acd-tutor.ts` and
  `src/agents/socratic-tutor.ts`.

**When you change code, run `bun test` and add or update the matching test
before considering the work done.** Touching the streaming/tool path? Re-run
`bun run test:e2e` too.

## Architecture

A CLI tutor built on [Flue](https://www.npmjs.com/package/@flue/cli) (agent framework, `@flue/runtime` + `@flue/sdk` + `@flue/cli` v0.9.x). Ships two interchangeable agents — `acd-tutor` and `socratic-tutor` — and the console offers a startup picker between them. Six layers — 2–4 are generic and agent-agnostic so other frontends (e.g. a future web app) can reuse them:

1. **Agent definitions** — `src/agents/acd-tutor.ts` and `src/agents/socratic-tutor.ts`: each `createAgent()` with model `anthropic/claude-sonnet-4-6`, a `local()` sandbox, and a `profile` from `src/agents/profiles/`. The exported `route` middleware opts each agent into HTTP transport at `POST /agents/<name>/:id`. Flue discovers them by filename (one agent per top-level `.ts` file in `src/agents/`; subdirectories like `profiles/` are ignored).
2. **Agent profiles** — `src/agents/profiles/<name>.ts`: the Flue `defineAgentProfile({ instructions, skills, tools })` for each agent, importing its SKILL.md via Flue's `import ... with { type: "skill" }`. Tutor behavior changes belong in the SKILL.md, not the CLI. **These import SKILL.md, so they only resolve inside Flue's build** — never import them from the host (`bun src/main.ts`).
3. **Server runner** — `src/runner.ts`: generic, agent-agnostic `startFlueServer()` — runs `flue build`, spawns `dist/server.mjs` with `PORT`, polls `/openapi.json` until ready, owns SIGINT/crash/shutdown handling. Returns `{ baseUrl, client, shutdown }`.
4. **Agent I/O** — `src/agent-io.ts`: generic, transport-only `createAgentSession(client, agent, instanceId?)` — pins an agent + conversation instance and exposes `send(payload): AsyncIterable<AgentChunk>` from the SDK's streaming invoke (SSE). Conversation memory is server-side, keyed by the instance id. No printing or prompting here.
5. **Console frontend** — `src/console/` (Ink/React): generic `runConsole(options)` — renders an arrow-key agent picker (`Menu.tsx`, skipped when there's one agent) then the chat (`App.tsx`): streamed-output rendering, action buttons, thinking indicator, error display. Knows nothing about the tutors or Flue; it takes `agents: AgentChoice[]` and `createReply(id)`, and each choice carries its own greeting/farewell/actions.
6. **CLI entry** — `src/main.ts`: composition only — starts the server and runs the console with `AGENT_CHOICES` (the host-safe registry in `src/agents/profiles/registry.ts`), wiring `createReply(id)` to a fresh `AgentSession` for the chosen agent.

### Flue conventions (important)

- `src/app.ts` is a **reserved filename**: flue treats it as a user-supplied Hono app (default export with `fetch()`) and the build fails otherwise. Don't put arbitrary code there — hence the CLI lives at `src/main.ts`.
- Flue scans `src/agents/` and `src/workflows/` for agent/workflow files; `flue.config.ts` (target: node) lives at the repo root.
- Edits to `src/agents/` and `src/skills/` require a rebuild — `bun start` always rebuilds first.

### General Code Style

- Don't write unnecessary comments.
- Comments immediately before functions (and exported interfaces/types) must be doc blocks (`/** ... */`), not `//` lines, so editors surface them on hover.
- When planning and writing code, always self-identify if code you write are actions, calculations, or data models.
- Actions are functions that perform side effects or interact with external systems (e.g., I/O, API calls, state mutations).
- Calculations are pure functions that take inputs and return outputs without side effects.
- Prefer calculations.
- Keep actions to a minimum.
- Group actions and calculations in related domains together.
- For data, always model them as entities (objects with explicit types and validation).
- When code locations and behavior change, keep this file updated.
