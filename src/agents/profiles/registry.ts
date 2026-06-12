import {
  AGENT_LIST,
  toPresentation,
  type AgentPresentation,
} from "../../shared/catalog";

/**
 * Host-safe list of the agents the frontends can launch, derived from the
 * shared catalog — `id` matches the Flue agent filename under src/agents/ so
 * createAgentSession(client, id) resolves the right agent (guarded by the
 * filesystem-consistency test in test/shared/catalog.test.ts).
 *
 * This module deliberately imports no Flue profiles or SKILL.md files — those
 * only resolve inside Flue's build, not under `bun src/main.ts` (the host).
 */
export const AGENT_CHOICES: AgentPresentation[] =
  AGENT_LIST.map(toPresentation);
