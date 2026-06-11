/**
 * Per-agent UI configuration: which editor (if any) the lesson screen uses,
 * card iconography, and the course outline shown on the dashboard. Agents
 * not listed here fall back to a chat-only screen with default styling.
 */

export type EditorKind = "code" | "markdown";

export interface CourseConfig {
  title: string;
  steps: Array<{ number: number; label: string }>;
}

export interface AgentUiConfig {
  /** Presence of an editor makes the agent use the IDE lesson screen. */
  editor?: EditorKind;
  icon: string;
  iconBg: string;
  course?: CourseConfig;
}

export const AGENT_UI: Record<string, AgentUiConfig> = {
  "acd-tutor": {
    editor: "code",
    icon: "🕵️",
    iconBg: "bg-cy-amber-soft",
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
    editor: "markdown",
    icon: "📝",
    iconBg: "bg-[#e5edff]",
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
    icon: "💭",
    iconBg: "bg-[#ffe5d6]",
  },
};

export const DEFAULT_AGENT_UI: AgentUiConfig = {
  icon: "✨",
  iconBg: "bg-cy-amber-soft",
};
