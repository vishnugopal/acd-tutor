export const SOCRATIC_LESSON = {
  title: "Beep · Socratic mode",
  houseRule: "House rule: Beep never gives the answer. You get there first.",
  xpReward: 15,

  chat: {
    opening: "Hi! I'm your thinking buddy. What are you curious about today? 🌟",
    script: [
      "Ooh, great question! Before I say anything — what do YOU think? Take a guess, there are no wrong guesses here.",
      "Interesting! Let's poke at it. Sunlight looks white, but it's secretly made of every color mixed together. What happens to light when it smacks into tiny air molecules?",
      "Right — it scatters! Now here's the twist: blue light gets scattered about 10× more than red. So when you look UP at the sky away from the sun… whose light is bouncing into your eyes?",
      "YOU figured it out. 🎉 Blue scatters everywhere, so the whole sky glows blue. +15 XP! Bonus round: at sunset the light travels through way more air… what color do you predict the sky turns, and why?",
    ],
  },

  /** Shown right after the "it scatters" exchange (script step index 1). */
  diagramAfterStep: 1,
  diagram: [
    "  ☀️  white light arrives",
    "   \\",
    "    \\    🔵   🔵    blue scatters",
    "     \\  🔵  🔵      EVERYWHERE",
    " ──────── air ────────",
    "  🔴 ─────────────▶  red goes straight",
    " ──────────────────────",
    "        👀 you, looking up = blue sky",
  ].join("\n"),
};
