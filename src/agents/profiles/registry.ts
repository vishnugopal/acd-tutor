import type { AgentChoice } from "../../console/types";

/**
 * Host-safe catalogue of the agents the console can launch. The console renders
 * this as a startup menu; `id` must match the Flue agent filename under
 * src/agents/ so createAgentSession(client, id) resolves the right agent.
 *
 * This module deliberately imports no Flue profiles or SKILL.md files — those
 * only resolve inside Flue's build, not under `bun src/main.ts` (the host).
 */

const CHECK_MY_WORK_PROMPT =
  "Please check my work: read my current lesson file, review what I've done so far, and give me feedback.";

export const AGENT_CHOICES: AgentChoice[] = [
  {
    id: "acd-tutor",
    label: "ACD Tutor",
    description:
      "Learn to tell apart Actions, Calculations, and Data in real code.",
    greeting: `Hi! Welcome to ACD tutor!

I'll teach you to tell apart Actions, Calculations, and Data in real code.
Say "let's start" (or anything, really) and I'll set up your first lesson —
or pick up right where you left off.
`,
    farewell: "Goodbye! Happy learning!",
    actions: [{ label: "Check my work", message: CHECK_MY_WORK_PROMPT }],
  },
  {
    id: "socratic-tutor",
    label: "Socratic Tutor",
    description:
      "Work through any subject by discovery — the tutor never just gives the answer.",
    greeting: `Hi! I'm your Socratic tutor.

Tell me what you're working on — a homework problem, a tricky idea, anything you
want to understand — and we'll figure it out together, step by step. I won't hand
you the answer; I'll help you find it.
`,
    farewell: "Goodbye! Keep asking great questions!",
    actions: [],
  },
];
