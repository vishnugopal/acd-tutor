# Exercise Bank - Stratified Design

Each lesson gets a fresh file, `lesson-N.ts`, written verbatim from the code
blocks below via `writeFile`, then shown with `openFile`.

---

## Lesson 1 - Levels

**Target insight:** Code can speak at different levels of meaning.
**Done when:** The learner sorts high-level intent and low-level detail and can
explain the difference in their own words.

File `lesson-1.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 1
// ------------------------------------------------------------
//  Same codebase idea, different levels of meaning.
// ============================================================

type Item = { sku: string; price: number; qty: number };

function itemSubtotal(item: Item): number {
  return item.price * item.qty;
}

function cartSubtotal(items: Item[]): number {
  let subtotal = 0;
  for (const item of items) {
    subtotal += itemSubtotal(item);
  }
  return subtotal;
}

function checkout(items: Item[]): number {
  const subtotal = cartSubtotal(items);
  const tax = subtotal * 0.08;
  return subtotal + tax;
}

// Q1: Mark each function as HIGH, MIDDLE, or LOW level.
// Q2: What words in each function name helped you decide?
export {};
```

---

## Lesson 2 - Call Graph

**Target insight:** A call graph makes levels visible.
**Done when:** The learner can name the levels and identify which functions call
which lower-level helpers.

File `lesson-2.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 2
// ------------------------------------------------------------
//  Draw the call graph in comments before changing code.
// ============================================================

type Cart = { userId: string; items: Array<{ sku: string; price: number; qty: number }> };

function checkout(cart: Cart): string {
  ensureCartHasItems(cart);
  const total = priceCart(cart);
  return buildReceipt(cart.userId, total);
}

function ensureCartHasItems(cart: Cart): void {
  if (cart.items.length === 0) throw new Error("empty cart");
}

function priceCart(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function buildReceipt(userId: string, total: number): string {
  return `Order for ${userId}: $${total.toFixed(2)}`;
}

// Q1: Write a call graph here in comments.
// Q2: Which functions are top, domain, and detail level?
// Q3: Which helper hides the most detail from checkout?
export {};
```

---

## Lesson 3 - Leaks

**Target insight:** High-level functions should not know low-level details.
**Done when:** The learner identifies detail leaks and proposes better helper
names without fully solving the refactor for them.

File `lesson-3.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 3
// ------------------------------------------------------------
//  This top-level function knows too many details.
// ============================================================

type Item = { sku: string; price: number; qty: number };

function summarizeOrder(userId: string, items: Item[]): string {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const rounded = Math.round(subtotal * 100) / 100;
  const dollars = rounded.toFixed(2);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  return `Order for ${userId}: ${itemCount} items, $${dollars}`;
}

// Q1: Which lines are lower-level details leaking into summarizeOrder?
// Q2: Invent helper names that would let summarizeOrder read at one level.
// Q3: Do not refactor yet. Just name the missing helpers.
export {};
```

---

## Lesson 4 - Wrap

**Target insight:** A wrapper can create a missing middle level.
**Done when:** The learner extracts a useful wrapper and explains why the caller
reads better with it.

File `lesson-4.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 4
// ------------------------------------------------------------
//  Create one wrapper that earns its name.
// ============================================================

type Item = { sku: string; price: number; qty: number };

function cartSubtotal(items: Item[]): number {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.price * item.qty;
  }
  return subtotal;
}

// Task: Extract the repeated detail inside the loop into a helper.
// Rule: the new helper name should say what the domain means, not how math works.
// After you refactor, answer: why is the caller clearer?
export {};
```

---

## Lesson 5 - Split

**Target insight:** Mixed-level functions can be split without changing behavior.
**Done when:** The learner extracts at least two coherent helpers and keeps the
same observable behavior.

File `lesson-5.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 5
// ------------------------------------------------------------
//  Split this mixed-level function.
// ============================================================

type Item = { sku: string; price: number; qty: number };

function printOrderSummary(userId: string, items: Item[]): string {
  if (items.length === 0) {
    throw new Error("empty order");
  }
  let subtotal = 0;
  for (const item of items) {
    if (item.qty <= 0) throw new Error(`bad quantity for ${item.sku}`);
    subtotal += item.price * item.qty;
  }
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const summary = `Order for ${userId}: $${total.toFixed(2)}`;
  console.log(summary);
  return summary;
}

// Task: Split this into helpers so printOrderSummary reads like a short story.
// Keep behavior the same. Mark each helper TOP, DOMAIN, DETAIL, or ACTION.
export {};
```

---

## Lesson 6 - One Down

**Target insight:** Good callers usually call one conceptual level below.
**Done when:** The learner inserts a domain-level helper between feature intent
and low-level field checks.

File `lesson-6.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 6
// ------------------------------------------------------------
//  This function jumps too far down.
// ============================================================

type Profile = { email: string; displayName: string; age: number };

function register(profile: Profile): string {
  if (!profile.email.includes("@")) throw new Error("bad email");
  if (profile.displayName.trim().length < 2) throw new Error("bad name");
  if (profile.age < 13) throw new Error("too young");
  return `registered:${profile.email.toLowerCase()}`;
}

// Q1: What level is register trying to be?
// Q2: Which lines are too low-level for that story?
// Task: Add one domain-level helper so register mostly calls one level down.
export {};
```

---

## Lesson 7 - Judgment

**Target insight:** Not every helper improves design.
**Done when:** The learner rejects bad helpers and explains which ones improve
the caller's vocabulary.

File `lesson-7.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 7
// ------------------------------------------------------------
//  Which helpers are useful, and which are noise?
// ============================================================

type Item = { price: number; qty: number };

function multiply(a: number, b: number): number {
  return a * b;
}

function itemSubtotal(item: Item): number {
  return item.price * item.qty;
}

function addTax(subtotal: number, rate: number): number {
  return subtotal + subtotal * rate;
}

function getPrice(item: Item): number {
  return item.price;
}

// Q: Rank these helpers from most useful to most noisy.
// For each one, say what level it gives the caller.
export {};
```

---

## Lesson 8 - API

**Target insight:** Design functions from the caller's vocabulary.
**Done when:** The learner writes a top-level caller first, then designs helper
signatures that make it read clearly.

File `lesson-8.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 8
// ------------------------------------------------------------
//  Design the API from the caller.
// ============================================================

type Cart = { items: Array<{ sku: string; price: number; qty: number }>; coupon?: string };

function checkout(cart: Cart): string {
  // Write this function first as a story.
  // You may call helpers that do not exist yet.
  // Then add the helper signatures below.
  return "???";
}

// Add helper signatures here. Bodies can be simple or TODO comments.

// Q: Which helper name came from the problem domain instead of implementation detail?
export {};
```

---

## Lesson 9 - Move

**Target insight:** Functions belong near the level that names them.
**Done when:** The learner reorders/groups functions by level and explains the
reader path.

File `lesson-9.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 9
// ------------------------------------------------------------
//  Reorder this module so the design reads top-to-bottom.
// ============================================================

type Item = { sku: string; price: number; qty: number };

function cents(n: number): number {
  return Math.round(n * 100);
}

function checkout(items: Item[]): string {
  const total = priceCart(items);
  return formatReceipt(total);
}

function itemSubtotal(item: Item): number {
  return item.price * item.qty;
}

function formatReceipt(total: number): string {
  return `$${(cents(total) / 100).toFixed(2)}`;
}

function priceCart(items: Item[]): number {
  return items.reduce((sum, item) => sum + itemSubtotal(item), 0);
}

// Task: Reorder the functions so a reader sees top-level, domain-level, then details.
// Add comments marking each group.
export {};
```

---

## Lesson 10 - Capstone

**Target insight:** A module can tell a clear top-to-bottom story.
**Done when:** The learner creates a readable top function, domain helpers,
detail helpers, and thin action boundaries.

File `lesson-10.ts`:

```ts
// ============================================================
//  Stratified Design Tutor - Lesson 10 (Capstone)
// ------------------------------------------------------------
//  Refactor this module into a stratified design.
// ============================================================

type Item = { sku: string; price: number; qty: number };
type Cart = { userId: string; items: Item[]; coupon?: "SAVE10" | "FREESHIP" };

async function fetchCart(userId: string): Promise<Cart> {
  const res = await fetch(`/api/carts/${userId}`);
  return res.json();
}

async function saveOrder(userId: string, total: number): Promise<void> {
  await fetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({ userId, total }),
  });
}

async function checkout(userId: string): Promise<string> {
  const cart = await fetchCart(userId);
  if (cart.items.length === 0) {
    console.log("empty cart");
    throw new Error("empty cart");
  }
  for (const item of cart.items) {
    if (item.qty <= 0) throw new Error(`bad quantity ${item.sku}`);
    if (item.price < 0) throw new Error(`bad price ${item.sku}`);
  }
  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.price * item.qty;
  }
  if (cart.coupon === "SAVE10") {
    subtotal = subtotal * 0.9;
  }
  const shipping = cart.coupon === "FREESHIP" || subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  const receipt = `Order for ${userId}: subtotal ${subtotal.toFixed(2)}, shipping ${shipping.toFixed(2)}, tax ${tax.toFixed(2)}, total ${total.toFixed(2)}`;
  await saveOrder(userId, total);
  console.log(receipt);
  return receipt;
}

// Task: Refactor into a stratified design.
// Aim for:
// - checkout as a thin action story
// - domain helpers for validation, pricing, and receipt building
// - detail helpers for item subtotal, coupon discount, shipping, tax, and money formatting
// - comments marking the levels
export {};
```
