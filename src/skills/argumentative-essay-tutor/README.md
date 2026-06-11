# Argumentative Essay Tutor

A Socratic writing tutor that teaches school students (roughly grades 6–10) to build **argumentative essays** — from "what even is an argument?" up to a complete, revised five-paragraph essay.

## What it does

- Teaches by **questioning, never telling** — it will not write a thesis, a reason, or an essay sentence for the student (sentence frames with blanks are its ceiling of help).
- Works through a fixed seven-lesson arc: write a gut-instinct claim → dissect an example argument's parts → rank evidence quality → steelman the other side → grow the claim into a thesis + outline → build one PEEL body paragraph → capstone essay with a revision pass.
- The student's **own topic threads through the course**: picked in Lesson 1, grown into the thesis, paragraph, and final essay in Lessons 5–7.
- Uses **per-lesson Markdown files** (`lesson-1.md` … `lesson-7.md`) as a two-way workbook: the tutor writes each exercise into a fresh file and opens it in the student's editor; answers go in the file or in chat — both work.
- **Storage-agnostic**: the tutor only sees four host-provided tools — `listFiles()`, `readFile()`, `writeFile()`, `openFile()` (defined in `src/tools.ts`). Where files live (`ESSAY_TUTOR_SCRATCH_DIR`, default `/tmp/essay-tutor/scratch`) and how they're shown is host-side configuration in `src/agents/profiles/argumentative-essay-tutor.ts`.
- **Resumes automatically**: on start the tutor lists the workbook files, figures out which lesson the student is on, and picks up where they left off.

## Files

- `SKILL.md` — the tutor's behavior: session flow, Socratic loop, lesson progression, core rules.
- `references/exercise-bank.md` — the seven lesson-file templates with per-lesson "done when" criteria.
- `references/essay-concepts.md` — the private answer key (argument anatomy, evidence ladder, thesis tests, PEEL, capstone rubric).
- `references/socratic-questions.md` — question patterns plus the stuck/disengagement playbooks.
