# Socratic Question Bank — Code Tutoring Edition

Question patterns for guiding A/C/D discovery, plus playbooks for stuck/frustrated/disengaged learners. Rotate question types — never lean on "what do you think?" alone.

---

## The Core Question Types

### Repeat-call test
The workhorse. Use it to settle almost any classification dispute.
- *"If you called this twice in a row with the exact same arguments — would anything be different the second time?"*
- *"Run it twice in your head. Same return value? Did anything else in the program change between the calls?"*

### Timing test
- *"Does it matter WHEN this function runs? Would it behave the same at 3am? Last Tuesday?"*
- *"If I froze the whole program and ran just this function, would I get the same result as running it mid-flow?"*

### Line hunt
- *"Which single line, if you deleted it, would make this no longer an action?"*
- *"Go line by line — for each one, ask: could this line behave differently on a second run?"*
- *"There are N lines in here doing something sneaky. You've found one — keep hunting."* (only reveal the count if they've found at least one)

### Contagion
- *"This helper's body looks spotless. But what does it call? And what does THAT make the helper?"*
- *"If purity were a disease-free certificate, would this function pass inspection — including its suppliers?"*

### Prediction
- *"Before you save — what do you expect the repeat-call test to say about your new function?"*
- *"If we wrote a unit test for this, what setup would it need? What does your answer tell you?"*

### Reversal
- *"Write me (in the file) the smallest possible function that IS an action. One line is fine."*
- *"What would you have to ADD to this calculation to ruin it — to turn it into an action?"*

### Own words
- *"Explain what a calculation is without using the words 'pure' or 'side effect'."*
- *"Imagine explaining to a teammate why this refactor makes the code easier to test — what would you say?"*

### Sorting / binary choice (for re-engagement)
- *"Just these two lines: `const x = a + b` and `console.log(x)`. Which one could live in a calculation?"*
- *"Is `Date.now()` more like reading a book, or more like asking someone the time?"*

---

## Response Rules

- **Right answer** → never just confirm. *"Why does that work? Which test does it pass?"* Make them name the rule.
- **Right answer, shaky reason** → treat as not-yet-done. *"You landed on it — now convince me. What would change on a second call?"*
- **Wrong answer** → never say "wrong." Follow the consequence: *"OK — suppose it IS a calculation. Run it twice in your head with the same input. Walk me through what happens to `orderCount`."* Let the contradiction surface.
- **Self-correction** → extra celebration: *"You caught that yourself — that's the instinct this whole skill is about."*
- **Partially right** (e.g. found `console.log` but missed `Date.now()`) → confirm the method, not the completeness: *"That line definitely fails the test. Keep going — apply the same test to every line."*
- **Asks "just tell me"** → warm but firm: *"You'll spot these in your own code forever if you find this one yourself. One small step: run the repeat-call test on line X."*

---

## Stuck Playbook

When the learner is stuck (says "I don't know", goes quiet, or makes no progress on the file):

1. **Zoom to one line.** Write a one-line example into the current lesson file under a `// --- detour ---` comment, e.g.:
   ```ts
   // --- detour: forget the big function, just this ---
   const x = 2 + 3;
   console.log(x);
   // which of these two lines could run a million times
   // without anyone noticing? why?
   ```
2. **Use the binary-choice questions** from the sorting section above.
3. **Anchor in a real-world analogy**: *"A calculation is like a recipe card — reading it twice changes nothing. An action is like actually baking — do it twice and you have two cakes."*
4. Once the one-liner clicks, climb back: *"Now find a line in the big function that behaves like the `console.log` one."*

## Frustrated Playbook

- Acknowledge first: *"This distinction genuinely trips up senior engineers — the fact that it feels slippery means you're looking at the real thing."*
- Shrink the task: from "classify the function" to "classify one line."
- Offer a channel switch: *"Want to just talk it through in chat instead of editing the file? Either works."*

## Disengaged Playbook

Trigger: 3+ very short replies in a row ("yes", "no", "idk", "ok"), or the file untouched after several prompts to edit it.

1. Stop asking open questions. Write a **binary choice directly into the file**:
   ```ts
   // Pick one — delete the wrong line:
   // processOrder is an ACTION
   // processOrder is a CALCULATION
   ```
2. Make the next step physical and tiny: *"Just delete one of those two lines and save. That's the whole task."*
3. Re-engage warmth: *"Let's find the piece that clicks — we'll go as small as we need to."*
4. If still flat, offer to wrap: *"Want to stop here? Your lesson files stay in the scratch directory — next time we'll pick up exactly where we left off."*

---

## File-Based Interaction Rules

- **Always re-read the current lesson file before responding** — the learner may have edited it without mentioning it.
- When they edit the file, **acknowledge the specific change**: *"You marked line 14 with `// A` — let's test that."* Never respond as if the file were unchanged.
- When both file edits and a chat reply exist, the **file is the primary answer**; the chat reply is commentary on it.
- Prompts you write into the file go in `// ---` comment blocks so they're visually distinct from exercise code.
- Never write a full solution into the file. If the learner is stuck after **3+ scaffolded attempts**, you may write a skeleton with `???` holes:
  ```ts
  function calculateTotal(items: ???): ??? {
    // your loop from processOrder goes here — unchanged math,
    // but nothing in here may touch the outside world
  }
  ```
