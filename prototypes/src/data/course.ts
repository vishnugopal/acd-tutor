import type { CourseStep } from "../types";

/** The 7 lessons of the Actions · Calculations · Data course. */
export const COURSE_STEPS: CourseStep[] = [
  { number: 1, label: "Warm-up" },
  { number: 2, label: "Sort it" },
  { number: 3, label: "Line Hunt" },
  { number: 4, label: "Contagion" },
  { number: 5, label: "Extract" },
  { number: 6, label: "Explicit" },
  { number: 7, label: "Capstone" },
];

/** Lessons completed before this session starts (dummy state). */
export const INITIAL_COMPLETED_LESSONS = [1, 2];

export const CURRENT_LESSON = 3;
