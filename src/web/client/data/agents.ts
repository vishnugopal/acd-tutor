import {
  agentDefinition,
  type AgentId,
  type CourseOutline,
  type EditorKind,
} from "../../../shared/catalog";

export type { CourseOutline, EditorKind };

/**
 * Cosmetic, web-only agent styling. Everything behavioral (editor kind,
 * course outline) lives in the shared catalog; this map only carries what the
 * catalog shouldn't know about — Tailwind classes and emoji.
 */
export interface AgentIcon {
  icon: string;
  iconBg: string;
}

const AGENT_ICONS = {
  "acd-tutor": { icon: "🕵️", iconBg: "bg-cy-amber-soft" },
  "argumentative-essay-tutor": { icon: "📝", iconBg: "bg-[#e5edff]" },
  "socratic-tutor": { icon: "💭", iconBg: "bg-[#ffe5d6]" },
} satisfies Record<AgentId, AgentIcon>;

const DEFAULT_AGENT_ICON: AgentIcon = { icon: "✨", iconBg: "bg-cy-amber-soft" };

/** Card iconography for a wire agent id (default styling outside the catalog). */
export function agentIcon(id: string): AgentIcon {
  return id in AGENT_ICONS ? AGENT_ICONS[id as AgentId] : DEFAULT_AGENT_ICON;
}

/** Dashboard course outline, if the agent has one. */
export function agentCourse(id: string): CourseOutline | undefined {
  return agentDefinition(id)?.course;
}

/** Which editor the lesson screen uses; undefined = chat-only screen. */
export function agentEditor(id: string): EditorKind | undefined {
  return agentDefinition(id)?.workspace?.editor;
}
