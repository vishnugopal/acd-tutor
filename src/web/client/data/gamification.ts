/**
 * Gamification is presentation-only for now — XP, streak, and hearts are
 * static placeholders until the server tracks them. Kept in one place so
 * wiring them up later is a single seam.
 */
export const STATIC_GAME = {
  xp: 140,
  xpGoal: 200,
  streak: 7,
  hearts: 3,
  maxHearts: 3,
};

/** Static course outline for the ACD stepper (titles match the 7 lessons). */
export const ACD_COURSE_STEPS = [
  { number: 1, label: "Warm-up" },
  { number: 2, label: "Sort it" },
  { number: 3, label: "Line Hunt" },
  { number: 4, label: "Contagion" },
  { number: 5, label: "Extract" },
  { number: 6, label: "Explicit" },
  { number: 7, label: "Capstone" },
];
