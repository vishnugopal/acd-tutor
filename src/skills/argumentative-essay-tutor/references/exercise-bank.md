# Exercise Bank — Lesson Files

Each lesson gets a fresh file, `lesson-N.md`, written from the templates below via the `writeFile` tool, then shown to the student with `openFile`.

Lessons 1–4 are written **verbatim**. Lessons 5–7 contain `{{...}}` slots — fill them with the student's own topic and prior work (from earlier lesson files) before writing.

Answer notes for every lesson are in [essay-concepts.md](essay-concepts.md) under "Per-Lesson Answer Notes".

All lesson files are plain CommonMark — no HTML, no JSX.

---

## Lesson 1 — Claim it (warm-up)

**Target insight:** a claim is something a reasonable person could disagree with — not a fact, not a personal preference.
**Done when:** the student has written a one-sentence claim that passes the disagree-test, plus one reason; AND they can say in their own words why "pizza is my favorite food" and "the school day is 6 hours long" are not claims. The claim should be a topic they care about — it seeds Lessons 5–7.
**Common misconception:** "a strong opinion is automatically an argument," or picking a claim nobody could dispute ("bullying is bad").

File `lesson-1.md`:

```md
# Lesson 1 — Claim it! ✍️

This file is our shared workbook. I write exercises here; you answer by
writing right in this file (it saves itself) or by replying in the chat.

Before any rules, let's see your instincts. In everyday terms: a **claim**
is something a thoughtful person could *disagree* with, and a **reason**
answers *"why should I believe you?"*

## ✍️ Your turn

**1. Write one sentence you genuinely believe — your claim.**

Need a spark? Some starters (or bring your own — better!):

- School should start later in the morning.
- Students should be allowed phones at school.
- Homework should be banned on weekends.
- Every kid should learn to code.

> My claim:

**2. Write your single strongest reason — why should I believe you?**

> My reason:

**3. Quick sort.** Which of these three could start an argument, and why?

- "Pizza is my favorite food."
- "The school day is six hours long."
- "The school day should be shorter."

> My answer:
```

---

## Lesson 2 — Spot the parts

**Target insight:** arguments have anatomy — claim, reasons, evidence — and each part has a different job.
**Done when:** the student has correctly labeled the claim, both reasons, and at least two pieces of evidence in the example, AND can explain the difference between a reason and evidence in their own words ("a reason is *why*, evidence is *how you know*").
**Common misconception:** treating any sentence they agree with as "the claim," or thinking reasons and evidence are the same thing.

File `lesson-2.md`:

```md
# Lesson 2 — Spot the parts 🔍

You wrote a claim and a reason from instinct. Now let's dissect a whole
argument someone else built, like biologists.

Read this short argument:

> Our school cafeteria should switch to reusable trays. The mountain of
> trash we produce is embarrassing: the janitors collect **eleven bags of
> tray waste every single day**, which adds up to over 2,000 bags a year.
> Disposable trays also cost more over time — the district in Riverdale
> saved **$4,800 in one year** after switching. Some say washing trays
> wastes water, but modern dishwashers use less water than it takes to
> manufacture a day's worth of disposables.

## ✍️ Your turn

**1. Which sentence is the CLAIM — the thing someone could disagree with?**

> The claim is:

**2. The argument gives two REASONS to believe the claim. What are they?**

> Reason 1:
> Reason 2:

**3. Underline the EVIDENCE.** List every number or fact the writer uses
to back up a reason.

> Evidence I found:

**4. In your own words: what's the difference between a reason and
evidence?**

> My answer:
```

---

## Lesson 3 — Evidence check

**Target insight:** evidence has quality levels — what convinces a friend may not convince a skeptic.
**Done when:** the student has ranked the five pieces of evidence with a defensible ordering (exact order matters less than the reasoning), AND can articulate at least two of the quality questions (Who says so? How many? Could I check it?) in their own words.
**Common misconception:** "more dramatic = more convincing," or treating one vivid story as stronger than systematic data.

File `lesson-3.md`:

```md
# Lesson 3 — Evidence check ⚖️

A claim is only as strong as what holds it up. Here's a claim and five
pieces of evidence someone might use for it.

**Claim: "Students should be allowed to bring phones to school."**

- **A.** My cousin says phones at his school are totally fine.
- **B.** A 2023 survey of 1,200 schools found that 68% of schools allowing
  phones reported no increase in classroom disruptions.
- **C.** Everyone knows phones are basically mini-computers now.
- **D.** Dr. Reyes, who studies how teens learn, says phones can support
  learning when teachers set clear rules.
- **E.** One time I used my phone to look up a word in class and the
  teacher said it was helpful.

## ✍️ Your turn

**1. Rank A–E from MOST convincing to LEAST convincing.**

> My ranking:

**2. Why did you put your #1 first? What makes it hard to argue with?**

> Because:

**3. Why did you put your last one last?**

> Because:

**4. The skeptic test:** imagine the strictest teacher in school reading
each piece. Write the comeback she'd have for your weakest two.

> Her comebacks:
```

---

## Lesson 4 — The other side

**Target insight:** naming the strongest counterargument and answering it makes an essay stronger, not weaker; concede-then-counter beats ignoring.
**Done when:** the student has written the *strongest* version of the opposing view (a steelman, not a strawman) for the example claim, AND a rebuttal that concedes something true before countering — and can say why ignoring the other side is a trap.
**Common misconception:** "mentioning the other side weakens my essay," or attacking a silly version of the opposing view.

File `lesson-4.md`:

```md
# Lesson 4 — The other side 🥊

Real arguments happen in a world where someone disagrees. The strongest
essays walk right up to the other side and shake hands first.

**Claim: "Homework should be banned on weekends."**

## ✍️ Your turn

**1. Be the other side — and be GOOD at it.** Write the strongest, fairest
argument AGAINST this claim. (If you write a weak one on purpose, everyone
can tell.)

> The other side's best argument:

**2. The handshake (concede).** What part of that argument is honestly
true? Start with "It's true that…"

> It's true that…

**3. The counter.** Now answer it: "…but…" — why does your side still win?

> …but…

**4. In your own words: why does naming the other side's best argument
make YOUR essay stronger?**

> My answer:
```

---

## Lesson 5 — Thesis + outline

**Target insight:** a thesis is the Lesson-1 claim grown up — sharpened until it's debatable, specific, and supportable — plus the shape of the reasons that will carry it.
**Done when:** the thesis passes all three tests (debatable / specific / supportable) with the student explaining how, AND the outline has two distinct reasons with at least a plan for evidence, plus the counterargument slot filled.
**Common misconception:** a topic ("phones at school") or an announcement ("this essay is about phones") posing as a thesis.

File `lesson-5.md` — fill `{{CLAIM}}` with the student's Lesson 1 claim (quote it exactly), and `{{REASON}}` with their Lesson 1 reason:

```md
# Lesson 5 — Your thesis + outline 🏗️

Time to build YOUR argument. In Lesson 1 you wrote:

> Claim: {{CLAIM}}
> Reason: {{REASON}}

Now we grow that claim into a **thesis** — a claim sharp enough to carry a
whole essay — and sketch the skeleton.

A thesis must pass three tests:

1. **Debatable** — a smart person could disagree.
2. **Specific** — says exactly what you mean (who? where? how much?).
3. **Supportable** — you can actually back it with reasons and evidence.

## ✍️ Your turn

**1. Write your thesis** — your claim, sharpened. (Check: would it pass
all three tests? Where does it score weakest?)

> My thesis:

**2. The skeleton.** Fill in your outline:

- **Reason 1:**
  - Evidence I have (or where I'd find it):
- **Reason 2:**
  - Evidence I have (or where I'd find it):
- **The other side's best argument:**
  - My concede-then-counter plan:

**3. Which of your two reasons is stronger? Why?**

> My answer:
```

---

## Lesson 6 — One strong paragraph

**Target insight:** a body paragraph is a mini-argument with four moves — Point, Evidence, Explanation, Link (PEEL) — and the Explanation (the "so what") is where most paragraphs fall flat.
**Done when:** the paragraph contains all four PEEL moves with the explanation genuinely connecting evidence to the thesis (not just repeating it), AND the hook makes a stranger want to keep reading. The student should be able to point at each move in their own paragraph.
**Common misconception:** dropping evidence in and assuming it speaks for itself ("quote and run"), or a hook that announces ("In this essay I will…").

File `lesson-6.md` — fill `{{THESIS}}` and `{{REASON_1}}` from the student's Lesson 5 outline:

```md
# Lesson 6 — One strong paragraph 🧱

Your outline gives the essay its bones. Now let's build one paragraph with
real muscle — your Reason 1 paragraph.

> Your thesis: {{THESIS}}
> Your Reason 1: {{REASON_1}}

A body paragraph makes four moves — **PEEL**:

- **P**oint — state the reason in one sentence.
- **E**vidence — show how you know.
- **E**xplain — connect the evidence back to your thesis. (*The move most
  writers skip!*)
- **L**ink — hand the reader to the next idea.

## ✍️ Your turn

**1. Write your Reason 1 paragraph here.** Don't aim for perfect — aim
for all four moves.

> ✏️ (write your paragraph here)

**2. Label your own moves.** After writing, mark where P, E, E, and L
each happen. Missing one? That's tomorrow's edit.

**3. The hook.** Separately, write the FIRST sentence of your whole essay
— something that makes a stranger want the second sentence. (A surprising
fact? A question? A tiny scene?)

> My hook:
```

---

## Lesson 7 — Capstone: the full essay

**Target insight:** an essay is the parts assembled — hook + thesis, two PEEL body paragraphs, a concede-and-counter paragraph, a conclusion that answers "so what?" — then *revised* against a checklist.
**Done when:** all five paragraphs exist and each checklist item is genuinely addressed (verify against the rubric in [essay-concepts.md](essay-concepts.md)); the student has made at least one self-driven revision after the first draft. Celebrate the *revision*, not just the draft.
**Common misconception:** "done = first draft finished," or a conclusion that just repeats the intro.

File `lesson-7.md` — fill `{{THESIS}}` from Lesson 5; if Lesson 6's paragraph is solid, note they can paste it in for Body Paragraph 1:

```md
# Lesson 7 — The full essay 🏆

Everything you've built comes together. You have a thesis, an outline, one
strong paragraph, and a hook. Now: the whole thing.

> Your thesis: {{THESIS}}

## Your essay's shape

1. **Intro** — your hook, a little context, then your thesis.
2. **Body 1** — Reason 1, PEEL. (Your Lesson 6 paragraph may belong here!)
3. **Body 2** — Reason 2, PEEL.
4. **The other side** — their best argument, concede, counter.
5. **Conclusion** — don't repeat; answer *"so what?"* What should the
   reader think or do now?

## ✍️ Your turn — write the essay below

# (your title here)

✏️ (write your essay here)

---

## Revision checklist (after the first draft!)

- [ ] My thesis is debatable, specific, and supportable.
- [ ] Each body paragraph has all four PEEL moves.
- [ ] My evidence would survive the skeptic test.
- [ ] I gave the other side its BEST argument, and answered it.
- [ ] My conclusion answers "so what?" instead of repeating the intro.
- [ ] I read it out loud and fixed the sentences I stumbled on.
```
