# Socratic Tutor — Claude Code Skill

A Socratic tutoring skill for kids aged 5–17. Guides learners through
first-principles discovery **without ever revealing the answer** — the
goal is to build the habit of rigorous thinking, not just get through
homework.

Works with **Claude Code CLI**, **Claude Desktop app**, and **IDE extensions** (VS Code, JetBrains).

---

## What it does

- Adapts to the learner's age (Explorer 5–8 · Builder 9–12 · Challenger 13–17)
- Asks questions that lead the kid to the answer themselves
- Uses physical experiments, analogies, and real-world examples
- Draws ASCII visuals with real objects — not abstract flowcharts
- Detects when a kid is stuck or disengaged and zooms out automatically
- After discovery: shows a confirmation diagram + links to interactive PhET simulations
- Remembers the learner's progress across sessions (locally, never shared)

---

## Installation

### Step 1 — Clone the repo

```bash
git clone https://github.com/Sharan0516/socratic-tutor ~/.claude/skills/socratic-tutor
```

### Step 2 — Run it

Open Claude Code (CLI, desktop app, or IDE) and type:

```
/socratic-tutor
```

That's it. The skill will ask for the learner's age on first run and create a local profile automatically.

---

## How to use

1. Type `/socratic-tutor` to start a session
2. The skill asks the kid's age (once, then remembers)
3. The kid types their question or problem — math, science, history, reading, coding, anything
4. Follow the questions — **don't just tell them the answer!**
5. When they get there themselves, they'll see a visual diagram + a link to an interactive simulation

---

## Topics with built-in resources

The skill has curated PhET simulations and Khan Academy links for:

- Newton's 1st, 2nd, and 3rd Laws of Motion
- Gravity & Orbits
- Projectile Motion
- Energy (Kinetic & Potential)
- Waves & Sound
- Electricity & Circuits
- Fractions, Multiplication, Area & Perimeter

More topics can be added to `references/resources.md`.

---

## Privacy

Learner profiles are stored **locally only** at `~/.claude/skills/socratic-tutor/learner-profile.md`.
They are excluded from this repo via `.gitignore` and never uploaded anywhere.

---

## Customizing

| File | What it controls |
|------|-----------------|
| `SKILL.md` | Main tutor logic and session flow |
| `references/age-tiers.md` | Tone, analogies, and question style per age group |
| `references/diagram-patterns.md` | Mermaid/ASCII diagram templates by subject |
| `references/resources.md` | PhET + Khan Academy links by topic |
| `learner-profile.md` | Auto-created locally on first run — not in repo |

---

## Requirements

- [Claude Code](https://claude.ai/code) (CLI, desktop, or IDE extension)
- A Claude account (free tier works)
