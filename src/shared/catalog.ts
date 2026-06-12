/**
 * The agent catalog — the single source of truth for agent identity and
 * presentation. Layer 0: pure data + calculations, free of node:* and
 * process.env, so it bundles into the browser, the host, and the Flue build
 * alike. Host-side env resolution (scratch dirs) lives in src/workspaces.ts.
 *
 * The Flue trio per agent (src/agents/<id>.ts stub, profiles/<id>.ts,
 * src/skills/<id>/) cannot be derived from data — Flue discovers agents by
 * filename — so a filesystem-consistency test (test/shared/catalog.test.ts)
 * asserts every AgentId has its stub, profile, and skill, and no orphans
 * exist. Forgetting a catalog entry itself is a compile error via
 * `satisfies Record<AgentId, AgentDefinition>`.
 */

/** A persistent action button surfaced by an agent (e.g. "Check my work"). */
export interface AgentAction {
  /** Button label, e.g. "Check my work". */
  label: string;
  /** The message sent to the agent when the button is pressed. */
  message: string;
}

/** Which web editor a workbook agent's lesson screen uses. */
export type EditorKind = "code" | "markdown";

export interface CourseStep {
  number: number;
  label: string;
}

/** Dashboard stepper outline; agents without one show no course card. */
export interface CourseOutline {
  title: string;
  steps: CourseStep[];
}

/** Present iff the agent manages lesson files (chat-only agents omit it). */
export interface AgentWorkspace {
  /** Env var that overrides the scratch dir. Resolved host-side (workspaces.ts). */
  dirEnvVar: string;
  defaultDir: string;
  /** Which editor the web lesson screen renders over the workspace. */
  editor: EditorKind;
}

export type AgentId =
  | "acd-tutor"
  | "argumentative-essay-tutor"
  | "socratic-tutor";

export interface AgentDefinition {
  id: AgentId;
  label: string;
  description: string;
  /** Shown once at the top of the transcript (client-side, never sent). */
  greeting: string;
  /** Printed by the console after the UI exits. */
  farewell?: string;
  actions: AgentAction[];
  workspace?: AgentWorkspace;
  course?: CourseOutline;
}

const CHECK_MY_WORK: AgentAction = {
  label: "Check my work",
  message:
    "Please check my work: read my current lesson file, review what I've done so far, and give me feedback.",
};

export const AGENTS = {
  "acd-tutor": {
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
    actions: [CHECK_MY_WORK],
    workspace: {
      dirEnvVar: "ACD_TUTOR_SCRATCH_DIR",
      defaultDir: "/tmp/acd-tutor/scratch",
      editor: "code",
    },
    course: {
      title: "Actions · Calculations · Data — course",
      steps: [
        { number: 1, label: "Warm-up" },
        { number: 2, label: "Sort it" },
        { number: 3, label: "Line Hunt" },
        { number: 4, label: "Contagion" },
        { number: 5, label: "Extract" },
        { number: 6, label: "Explicit" },
        { number: 7, label: "Capstone" },
      ],
    },
  },
  "argumentative-essay-tutor": {
    id: "argumentative-essay-tutor",
    label: "Essay Tutor",
    description:
      "Learn to build a convincing argument — and grow it into a full essay.",
    greeting: `Hi! Welcome to the Essay tutor!

I'll teach you how to build an argument that can actually change someone's
mind — and grow it into a full essay, step by step.
Say "let's start" (or anything, really) and I'll set up your first lesson —
or pick up right where you left off.
`,
    farewell: "Goodbye! Keep arguing well!",
    actions: [CHECK_MY_WORK],
    workspace: {
      dirEnvVar: "ESSAY_TUTOR_SCRATCH_DIR",
      defaultDir: "/tmp/essay-tutor/scratch",
      editor: "markdown",
    },
    course: {
      title: "Argumentative Essay — course",
      steps: [
        { number: 1, label: "Claim it" },
        { number: 2, label: "The parts" },
        { number: 3, label: "Evidence" },
        { number: 4, label: "Other side" },
        { number: 5, label: "Thesis" },
        { number: 6, label: "Paragraph" },
        { number: 7, label: "Full essay" },
      ],
    },
  },
  "socratic-tutor": {
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
} satisfies Record<AgentId, AgentDefinition>;

export const AGENT_LIST: AgentDefinition[] = Object.values(AGENTS);

export function isAgentId(value: string): value is AgentId {
  return value in AGENTS;
}

/**
 * The catalog entry for a wire agent id, or null for ids outside the catalog
 * (e.g. the e2e suite's injected tutor-faux agent).
 */
export function agentDefinition(id: string): AgentDefinition | null {
  return isAgentId(id) ? AGENTS[id] : null;
}

/**
 * The wire/menu subset of an agent: what the console menu renders and what
 * GET /api/agents serves. `id` is a plain string so frontends stay open to
 * injected agents that aren't in the catalog.
 */
export interface AgentPresentation {
  id: string;
  label: string;
  description?: string;
  greeting?: string;
  farewell?: string;
  actions?: AgentAction[];
}

export function toPresentation(def: AgentDefinition): AgentPresentation {
  return {
    id: def.id,
    label: def.label,
    description: def.description,
    greeting: def.greeting,
    farewell: def.farewell,
    actions: def.actions,
  };
}
