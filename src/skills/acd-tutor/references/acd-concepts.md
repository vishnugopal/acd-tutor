# ACD Concepts — Tutor's Answer Key

This is YOUR reference, never the learner's. Use it to verify their reasoning — never quote definitions at them before they've discovered the idea themselves.

Based on *Grokking Simplicity* by Eric Normand (ch. 3–5).

---

## The Three Categories

### Data
**Facts about events.** Inert — it doesn't *do* anything. It can only be interpreted.

- Examples: a string, a number, an array of items, a config object, `{ name: "Alice", qty: 2 }`
- Key property: data is transparent — you can look at it, compare it, serialize it. It never runs.
- In TypeScript: literals, plain objects/arrays, values bound by `const`. Type annotations describe data shapes.

### Calculations
**Computations from inputs to outputs.** Same inputs → same output, every time, and nothing else happens.

- Also called: pure functions, mathematical functions.
- Key properties:
  - Doesn't matter **when** it runs.
  - Doesn't matter **how many times** it runs.
  - All inputs come in through arguments (explicit inputs); the only output is the return value (explicit output).
- Examples: `sum(numbers)`, `applyDiscount(total, rate)`, string formatting that just returns a string.

### Actions
**Anything that depends on when it runs or how many times it runs.**

- Also called: impure functions, functions with side effects.
- The two-part test:
  - **When** it runs matters (reading a clock, reading mutable state, fetching from a server).
  - **How many times** it runs matters (sending an email twice ≠ once, appending to a log, incrementing a counter).
- Examples: `console.log`, `fetch`, `Date.now()`, `Math.random()`, writing a file, mutating a variable outside the function, mutating an argument.

---

## The Identification Checklist (for verifying learner answers)

A function is an **action** if ANY of these is true:

1. It reads anything that can change between calls (globals, `Date.now()`, `Math.random()`, DOM, files, network, databases).
2. It writes/changes anything outside its own local scope (module-level variables, arguments it mutates, the console, the network, the disk, the DOM).
3. It calls any function that is itself an action (see contagion below).

If none are true and it returns a value computed only from its arguments → **calculation**.
If it doesn't run at all → **data**.

### The Hidden-Actions Zoo
These make a function an action even when it "looks pure":

| Hidden action | Why |
|---|---|
| `Date.now()` / `new Date()` | output depends on *when* it runs |
| `Math.random()` | different output each call |
| Reading a module-level `let` variable | someone may have changed it between calls |
| Mutating an argument (`items.push(...)`, `order.total = ...`) | caller's data changes — running twice ≠ once |
| `console.log` | observable effect on the world; running twice ≠ once |
| `fetch` / DB / file I/O | both reads-the-changing-world and affects it |
| Throwing based on external state | timing-dependent behavior |

Note for nuance: `console.log` for *debugging* is pragmatically tolerated, but for classification purposes it makes the function an action. Don't let the learner hand-wave it.

---

## The Contagion Rule (Actions Spread)

> If function A calls function B, and B is an action, then A is an action. All the way up the call stack.

There is no containment: one `Date.now()` three layers deep makes every caller above it an action. This is *why* we extract calculations — actions can't be un-actioned, but they can be made thin.

---

## Implicit vs. Explicit Inputs and Outputs

This is the lever for converting actions into calculations:

- **Explicit input**: an argument. **Implicit input**: anything else the function reads (globals, clock, etc.)
- **Explicit output**: the return value. **Implicit output**: anything else the function changes (globals, arguments, console, etc.)

**A calculation is exactly: a function whose inputs and outputs are ALL explicit.**

The extraction recipe (what the learner should discover, not be told):
1. Find the computational core of the action.
2. Pull it into a new function.
3. Convert each implicit input into a parameter.
4. Convert each implicit output into (part of) the return value.
5. The original action becomes a thin shell: gather inputs → call the calculation → apply outputs to the world.

---

## Why It Matters (for the wrap-up discussion)

Calculations are:
- **Testable** without mocks, setup, or teardown — pass inputs, assert on output.
- **Reusable** in any context (server, browser, test, batch job) — no environment needed.
- **Composable** and safe to run anytime, anywhere, any number of times — including in parallel.
- **Easier to reason about** — you never need to know what happened before or what the rest of the system is doing.

Actions are unavoidable (a program that does nothing observable is useless) — the goal is a **thin action layer** orchestrating a **large calculation core** over **plain data**.

---

## Per-Lesson Answer Notes

(See [exercise-bank.md](exercise-bank.md) for the exercise source code.)

### Lesson 1 — write your own A/C/D (warm-up)
- There is no fixed answer — verify each of the learner's three artifacts against the Identification Checklist above.
- Typical failure modes:
  - "Calculation" that logs, mutates a variable, or reads a module-level `let` → run the repeat-call test on *their own* function; let the contradiction surface.
  - "Data" written as a function or expression that runs → ask: *"Does this DO anything, or does it just sit there?"*
  - "Action" that's accidentally pure (e.g. just returns a sum) → celebrate the instinct, then ask them to break it: *"What would you add so that running it twice actually mattered?"*
- Done = all three genuinely in the right category AND the learner defends each in their own words with when-/how-many-times reasoning. Their artifacts are reusable material for later detours.

### Lesson 2 — `processOrder`
- Classification: **action** (mutates module-level `orderCount`, calls `console.log`).
- The data in the file: the `Item` shape, the `items` array literal, the `DISCOUNT_THRESHOLD` and `DISCOUNT_RATE` constants, the computed `total` value, the receipt string. Numbers and strings throughout.
- Common wrong answer: "calculation, because it computes a total." Counter with the repeat-call test (orderCount differs) and the observable-log test.

### Lesson 3 — line hunt in `createUserSession`
- Action-making lines: `Date.now()` (timing input), `Math.random()` (nondeterminism), `console.log` (output effect), reading module-level `let activeSessions` and pushing to it (implicit input + mutation).
- The conditional and string concatenation are NOT what makes it an action — learners often blame "complexity" rather than effects.

### Lesson 4 — contagion in `formatGreeting` → `getTimeOfDay`
- `formatGreeting` looks pure (takes a name, returns a string) but calls `getTimeOfDay`, which reads the clock → both are actions.
- Target insight: purity is a property of the whole call graph, not the function body you can see.
- Bonus discovery: fix is to pass the hour (or the time-of-day string) IN as a parameter.

### Lesson 5 — extracting from `processOrder`
- Correct shape: a pure `calculateTotal(items): number` (or `calculateOrder(items): { total, receipt }`), with `processOrder` reduced to: call calculation → log → increment counter.
- Verify with: repeat-call test on the new function; check no remaining reads/writes of anything non-local inside it.
- Acceptable variations: separate `formatReceipt(items, total): string` calculation; returning a result object. Don't demand one exact shape — demand all-explicit inputs/outputs.

### Lesson 6 — implicit → explicit in `applyLoyaltyDiscount`
- Implicit input: module-level `loyaltyRates` and `currentTier`. Implicit output: mutates the `order` argument (`order.total = ...`, `order.discountApplied = true`).
- Correct shape: calculation takes `(order, tier, rates)` and **returns a new order object** (spread/copy) instead of mutating. The thin action reads the globals and passes them in.
- Watch for: learner makes inputs explicit but still mutates the argument — that's still an implicit output. One more nudge needed.

### Lesson 7 — capstone `checkout`
- The original interleaves: fetching a cart (action), validation logic (extractable calculation), tax + shipping math (extractable calculation), receipt formatting (extractable calculation), logging and saving (actions).
- Done looks like: 2–4 pure functions (e.g. `validateCart`, `priceCart` / `calculateTax` + `calculateShipping`, `formatReceipt`) + plain data shapes + a `checkout` action of roughly 5–8 lines that only sequences: fetch → calculations → save/log.
- Grade on the structure (thin action / calculation core / data), not on matching your decomposition.
