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
```

There are no tests yet. The `ANTHROPIC_API_KEY` lives in `.env` (loaded by flue).

## Architecture

A CLI Socratic tutor built on [Flue](https://www.npmjs.com/package/@flue/cli) (agent framework, `@flue/runtime` + `@flue/sdk` + `@flue/cli` v0.9.x). Five layers — 2–4 are generic and tutor-agnostic so other frontends (e.g. a future web app) can reuse them:

1. **Agent definition** — `src/agents/main.ts`: `createAgent()` with model `anthropic/claude-sonnet-4-6` and the skill imported via Flue's `import ... with { type: "skill" }` from `src/skills/socratic-tutor/SKILL.md`. The exported `route` middleware opts the agent into HTTP transport at `POST /agents/main/:id`. Tutor behavior changes belong in the SKILL.md, not the CLI.
2. **Server runner** — `src/runner.ts`: generic, agent-agnostic `startFlueServer()` — runs `flue build`, spawns `dist/server.mjs` with `PORT`, polls `/openapi.json` until ready, owns SIGINT/crash/shutdown handling. Returns `{ baseUrl, client, shutdown }`.
3. **Agent I/O** — `src/agent-io.ts`: generic, transport-only `createAgentSession(client, agent, instanceId?)` — pins an agent + conversation instance and exposes `send(payload): AsyncIterable<string>`, yielding only the reply's text chunks from the SDK's streaming invoke (SSE). Conversation memory is server-side, keyed by the instance id. No printing or prompting here.
4. **Console frontend** — `src/console.ts`: generic streaming REPL `runConsole(options)` — readline loop, streamed-output rendering, thinking indicator, error display. Knows nothing about the tutor or Flue; the reply source is a caller-supplied `reply(line): AsyncIterable<string>`, and all user-facing strings (greeting, farewell, empty-reply message, indicator, error format) are options.
5. **CLI entry** — `src/main.ts`: composition only — starts the server, creates an `AgentSession` for agent `"main"`, and runs the console with the tutor-specific strings.

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
