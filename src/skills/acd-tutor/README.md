# ACD Tutor

A Socratic tutor that teaches novice JavaScript/TypeScript programmers to identify and separate **Actions, Calculations, and Data** — the core mental model from [*Grokking Simplicity*](https://grokkingsimplicity.com/) by Eric Normand (ch. 3–5).

## What it does

- Teaches by **questioning, never telling** — it will not classify a function for you or point at the guilty line.
- Works through a fixed six-lesson arc: classify a mixed function → spot the hidden actions → discover that actions spread → extract calculations → make implicit inputs/outputs explicit → a capstone refactor.
- Uses **per-lesson files** (`lesson-1.ts` … `lesson-6.ts`) as a two-way workspace: the tutor writes each exercise into a fresh file and opens it in your editor; you answer by **editing the file** (annotate lines, refactor code) or by **replying in chat** — both work.
- **Storage-agnostic**: the tutor only sees four host-provided tools — `listFiles()`, `readFile()`, `writeFile()`, `openFile()` (defined in `src/tools.ts`). Where files live (`ACD_TUTOR_SCRATCH_DIR`, default `/tmp/acd-tutor/scratch`) and which editor opens them (`$EDITOR`) are host-side agent configuration in `src/agents/main.ts`.
- **Resumes automatically**: on start the tutor lists your lesson files, figures out which lesson you're on, and picks up where you left off.

## Who it's for

Programmers who know basic JS/TS (functions, objects, arrays, async basics) but haven't been exposed to functional programming or the action/calculation/data distinction. No profile setup, no topic selection — just start.

## Usage

Invoke the skill (`/acd-tutor` or ask to be taught actions, calculations, and data). The tutor will:

1. List your existing lesson files and resume if you have history — otherwise write `lesson-1.ts` and open it in your editor.
2. Ask you to classify the function it contains and point out the data.
3. Keep questioning — every reply, it re-reads your file, so edit freely.

Lesson files stay on disk, so you can leave and pick up where you stopped.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Tutor logic and session flow |
| `references/acd-concepts.md` | Tutor's private answer key (definitions, checklists, per-lesson notes) |
| `references/exercise-bank.md` | TypeScript source for all six lesson files |
| `references/socratic-questions.md` | Question patterns and stuck/frustrated/disengaged playbooks |

## Credit

The teaching content is based on *Grokking Simplicity: Taming complex software with functional thinking* by Eric Normand (Manning, 2021). Buy the book — it's excellent.
