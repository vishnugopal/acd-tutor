import type { LineSpec } from "../types";

export const ACD_LESSON = {
  fileName: "lesson-3.ts",
  title: "Lesson 3: The Line Hunt",
  xpReward: 20,

  initialCode: `let sessionCount = 0;

function createUserSession(userId: string) {
  const sessionId = Math.random().toString(36).slice(2);  // ?
  const createdAt = Date.now();                           // ?
  const session = { userId, sessionId, createdAt };       // ?
  sessionCount = sessionCount + 1;                        // ?
  console.log("session created:", sessionId);             // ?
  return session;                                         // ?
}
`,

  lines: [
    { key: "Math.random", expect: "A", isAction: true },
    { key: "Date.now", expect: "A", isAction: true },
    {
      key: "const session =",
      expect: "ok",
      isAction: false,
      hint: "Look again at `{ userId, sessionId, createdAt }` — does building that object touch anything outside the function? Or does it only use its inputs?",
    },
    { key: "sessionCount + 1", expect: "A", isAction: true },
    { key: "console.log", expect: "A", isAction: true },
    {
      key: "return session",
      expect: "ok",
      isAction: false,
      hint: "Does `return session` change anything in the outside world — or just hand the result back? Handing back the answer is a calculation's whole job.",
    },
  ] satisfies LineSpec[],

  chat: {
    opening:
      "Welcome to the Line Hunt! 🔍 Some of these lines secretly touch the outside world. Mark each one `// A` or `// ok` — watch them tint as you type — then hit Check.",
    script: [
      "Good thinking! Quick test: if you called this function twice in a row, would anything be different the second time?",
      "Exactly — Math.random() answers differently every call. That's the repeat-call test failing. See any other lines like that?",
      "What about the line that changes sessionCount? Who else can see that variable?",
      "You're close. Remember: a calculation only looks at its inputs and only produces a return value. Everything else is an action.",
    ],
  },

  successMessage:
    "All 6 classified! Math.random, Date.now, the sessionCount mutation and console.log were the actions — and you certified both pure lines. Clean build. ✓",
};
