# Exercise Bank — Lesson Files

Each lesson gets a fresh file at `/tmp/acd-tutor/scratch/lesson-N.ts`, written verbatim from the code blocks below (including the header comment), then opened in `$EDITOR`.

Answer notes for every lesson are in [acd-concepts.md](acd-concepts.md) under "Per-Lesson Answer Notes".

---

## Lesson 1 — Classify the mixed function + spot the data

**Target insight:** functions that compute something can still be actions; data is everything inert in the file.
**Done when:** learner correctly classifies `processOrder` as an action with a *reason rooted in effects* (not vibes), and identifies most of the data (items array, constants, strings/numbers — perfection not required, reasoning is).
**Common misconception:** "it computes a total, so it's a calculation."

File `lesson-1.ts`:

```ts
// ============================================================
//  ACD Tutor — Lesson 1
// ------------------------------------------------------------
//  This file is our shared workspace. I write exercises here;
//  you can answer by editing this file (add comments, change
//  code) or by replying in the chat. Save the file when done.
// ============================================================

type Item = { name: string; price: number; quantity: number };

const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.1;

let orderCount = 0;

function processOrder(items: Item[]): number {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  if (total > DISCOUNT_THRESHOLD) {
    total = total * (1 - DISCOUNT_RATE);
  }
  orderCount = orderCount + 1;
  console.log(`Receipt #${orderCount}: ${items.length} items, total $${total.toFixed(2)}`);
  return total;
}

const groceries: Item[] = [
  { name: "rice", price: 12, quantity: 2 },
  { name: "olive oil", price: 18, quantity: 1 },
  { name: "coffee", price: 24, quantity: 3 },
];

processOrder(groceries);

// ------------------------------------------------------------
//  Q1: Is processOrder an ACTION, a CALCULATION, or DATA?
//      What's your gut reason?
//  Q2: Point out every piece of DATA you can find in this file.
//      (Tip: annotate lines with comments, or list them in chat.)
// ------------------------------------------------------------
export {}; // makes this file a module so lesson files never clash with each other
```

---

## Lesson 2 — Pinpoint the action lines (the hidden-actions zoo)

**Target insight:** specific lines make a function an action — and some of them hide well (`Date.now`, `Math.random`, reading mutable globals).
**Done when:** learner identifies all four kinds of action lines (clock, randomness, global read/mutation, console) and can say *why each one* fails the same-input-same-output / doesn't-matter-when-or-how-many-times test.
**Common misconception:** blaming complexity ("the if-statement", "the string building") instead of effects.

File `lesson-2.ts`:

```ts
// ============================================================
//  ACD Tutor — Lesson 2
// ------------------------------------------------------------
//  Same workspace, new puzzle. Edit this file or reply in chat.
// ============================================================

type Session = { id: string; user: string; startedAt: number };

let activeSessions: Session[] = [];

function createUserSession(user: string): Session {
  const id = "sess_" + Math.floor(Math.random() * 100000);
  const startedAt = Date.now();
  let label = user;
  if (user.length > 10) {
    label = user.slice(0, 10) + "…";
  }
  const session: Session = { id, user: label, startedAt };
  activeSessions.push(session);
  console.log(`session created for ${label} (${activeSessions.length} active)`);
  return session;
}

// ------------------------------------------------------------
//  This function is an ACTION. But not every line is to blame.
//
//  Q: Mark each line inside createUserSession with a comment:
//       // A  -> this line is what makes it an action
//       // ok -> this line would be fine in a calculation
//     For every "A", say what test it fails.
// ------------------------------------------------------------
export {}; // makes this file a module so lesson files never clash with each other
```

---

## Lesson 3 — Actions spread (contagion)

**Target insight:** calling an action makes you an action — purity is a property of the whole call graph.
**Done when:** learner states that `formatGreeting` is an action *because of what it calls*, and discovers the fix (pass the time-dependent value in as a parameter).
**Common misconception:** "the body of `formatGreeting` has no side effects, so it's a calculation."

File `lesson-3.ts`:

```ts
// ============================================================
//  ACD Tutor — Lesson 3
// ------------------------------------------------------------
//  Edit this file or reply in chat.
// ============================================================

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function formatGreeting(name: string): string {
  const timeOfDay = getTimeOfDay();
  return `Good ${timeOfDay}, ${name}!`;
}

// ------------------------------------------------------------
//  Q1: Look only at formatGreeting's body. Action or
//      calculation? Now look at the whole picture. Did your
//      answer change? Why?
//  Q2: Can you change formatGreeting so it becomes a true
//      calculation — WITHOUT deleting the greeting feature?
//      (Rewrite it right here in the file.)
// ------------------------------------------------------------
export {}; // makes this file a module so lesson files never clash with each other
```

---

## Lesson 4 — Extract the calculation

**Target insight:** an action can't be made pure, but its computational core can be pulled out into a calculation, leaving a thin action.
**Done when:** the learner's refactor has a function computing total (and optionally the receipt string) with ALL inputs as arguments and ALL outputs in the return value, and `processOrder` reduced to a thin shell. Accept any decomposition that satisfies all-explicit inputs/outputs.
**Common misconception:** moving the loop into a helper that still reads/writes `orderCount` or still logs — extraction without purification.

File `lesson-4.ts`:

```ts
// ============================================================
//  ACD Tutor — Lesson 4
// ------------------------------------------------------------
//  Remember processOrder from Lesson 1? Here it is again.
//  This time you're going to operate on it.
// ============================================================

type Item = { name: string; price: number; quantity: number };

const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.1;

let orderCount = 0;

function processOrder(items: Item[]): number {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  if (total > DISCOUNT_THRESHOLD) {
    total = total * (1 - DISCOUNT_RATE);
  }
  orderCount = orderCount + 1;
  console.log(`Receipt #${orderCount}: ${items.length} items, total $${total.toFixed(2)}`);
  return total;
}

// ------------------------------------------------------------
//  Task: Refactor so the MATH lives in a calculation and
//  processOrder becomes a thin action that uses it.
//
//  Rules of the game:
//    - The behavior must stay the same (same log, same count).
//    - Your new function(s) must pass this test: calling them
//      twice with the same arguments changes NOTHING and
//      returns the same thing both times.
//
//  Write your refactor below (or modify the code above).
// ------------------------------------------------------------
export {}; // makes this file a module so lesson files never clash with each other
```

---

## Lesson 5 — Implicit → explicit (the harder extraction)

**Target insight:** implicit inputs become parameters; implicit outputs become return values. Mutating an argument is an implicit output.
**Done when:** learner's calculation takes the tier/rates as parameters AND returns a new order object instead of mutating the argument; the action shell reads the globals and applies the result.
**Common misconception:** parameterizing the globals but still mutating `order` — inputs fixed, output still implicit.

File `lesson-5.ts`:

```ts
// ============================================================
//  ACD Tutor — Lesson 5
// ------------------------------------------------------------
//  This one cheats in two different directions. Find both.
// ============================================================

type Order = { items: string[]; total: number; discountApplied: boolean };

const loyaltyRates: Record<string, number> = {
  bronze: 0.02,
  silver: 0.05,
  gold: 0.1,
};

let currentTier = "silver";

function applyLoyaltyDiscount(order: Order): void {
  const rate = loyaltyRates[currentTier] ?? 0;
  order.total = order.total * (1 - rate);
  order.discountApplied = true;
}

// ------------------------------------------------------------
//  Q1: This function takes an argument and does math — but
//      it's an action. It has a sneaky INPUT that isn't a
//      parameter, and a sneaky OUTPUT that isn't a return
//      value. Can you name both?
//  Q2: Rewrite it as a calculation + a thin action.
//      Hint-free zone: the repeat-call test is your judge.
// ------------------------------------------------------------
export {}; // makes this file a module so lesson files never clash with each other
```

---

## Lesson 6 — Capstone: separate a realistic function

**Target insight:** the architecture goal — thin action layer, calculation core, plain data.
**Done when:** the refactor has (a) 2–4 pure functions covering validation, pricing/tax/shipping, and formatting; (b) a `checkout` action of roughly 5–8 lines that only sequences fetch → calculations → save/log; (c) learner can point at each piece and name its category. Grade structure, not whether their decomposition matches yours.
**Common misconception:** extracting one mega-"calculation" that still calls `saveOrder` or `console.log` inside.

File `lesson-6.ts`:

```ts
// ============================================================
//  ACD Tutor — Lesson 6 (Capstone)
// ------------------------------------------------------------
//  A realistic mess. Separate it into:
//    - DATA          (plain shapes and values)
//    - CALCULATIONS  (all inputs/outputs explicit)
//    - a thin ACTION (just orchestration)
// ============================================================

type CartItem = { sku: string; price: number; qty: number };
type Cart = { userId: string; items: CartItem[] };

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_FLAT = 5.99;

async function fetchCart(userId: string): Promise<Cart> {
  const res = await fetch(`https://api.example.com/carts/${userId}`);
  return res.json();
}

async function saveOrder(userId: string, total: number): Promise<void> {
  await fetch(`https://api.example.com/orders`, {
    method: "POST",
    body: JSON.stringify({ userId, total }),
  });
}

async function checkout(userId: string): Promise<string> {
  const cart = await fetchCart(userId);

  if (cart.items.length === 0) {
    console.log(`checkout failed for ${userId}: empty cart`);
    throw new Error("Cart is empty");
  }
  for (const item of cart.items) {
    if (item.qty <= 0 || item.price < 0) {
      console.log(`checkout failed for ${userId}: bad item ${item.sku}`);
      throw new Error(`Invalid item: ${item.sku}`);
    }
  }

  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.price * item.qty;
  }
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = subtotal + tax + shipping;

  let receipt = `Order for ${userId}\n`;
  for (const item of cart.items) {
    receipt += `  ${item.sku} x${item.qty} @ $${item.price.toFixed(2)}\n`;
  }
  receipt += `  subtotal: $${subtotal.toFixed(2)}\n`;
  receipt += `  tax: $${tax.toFixed(2)}\n`;
  receipt += `  shipping: $${shipping.toFixed(2)}\n`;
  receipt += `  TOTAL: $${total.toFixed(2)}`;

  await saveOrder(userId, total);
  console.log(receipt);
  return receipt;
}

// ------------------------------------------------------------
//  Task: Refactor checkout. When you're done, you should be
//  able to label every function in this file with A, C, or D
//  — and the calculations should be testable with zero mocks.
//
//  Then answer in chat: which parts could you now unit-test
//  without a network?
// ------------------------------------------------------------
export {}; // makes this file a module so lesson files never clash with each other
```
