export type Screen = "home" | "acd" | "socratic";

export type MascotMood = "idle" | "cheer" | "think";

export type ChatRole = "tutor" | "user";

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
  /** "diagram" messages render in a monospace card instead of a bubble */
  kind?: "text" | "diagram";
}

/** One classifiable line in an ACD exercise. */
export interface LineSpec {
  /** Substring that uniquely identifies the line in the source. */
  key: string;
  /** The mark the student should give the line. */
  expect: "A" | "ok";
  /** True if the line is an action (used to phrase hints). */
  isAction: boolean;
  /** Tutor hint shown when a pure line is wrongly marked as an action. */
  hint?: string;
}

export interface CourseStep {
  number: number;
  label: string;
}

export interface LessonSummary {
  xpEarned: number;
  accuracy: number;
  streak: number;
}
