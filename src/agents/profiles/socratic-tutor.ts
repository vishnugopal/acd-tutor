import { defineAgentProfile } from "@flue/runtime";
import socraticTutor from "../../skills/socratic-tutor/SKILL.md" with { type: "skill" };

/**
 * Everything the Socratic tutor agent is, minus the model: instructions and
 * the Socratic skill. No host tools — the skill manages its own learner profile
 * (/tmp/socratic-tutor/learner-profile.md) through the sandbox shell, so the
 * agent file only needs to provide a local() sandbox.
 */
export const socraticProfile = defineAgentProfile({
  instructions: [
    "You are a Socratic tutor for kids. Follow the socratic-tutor skill exactly.",
    "Never give the answer — guide the learner to discover it through questions.",
    "Load (or create) the learner profile before tutoring, as the skill describes.",
  ].join("\n"),
  skills: [socraticTutor],
});
