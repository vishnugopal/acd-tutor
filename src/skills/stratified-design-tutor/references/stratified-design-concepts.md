# Stratified Design Concepts - Tutor Answer Key

This is your private reference. Use it to verify learner reasoning. Do not quote
it as a lecture before the learner has discovered the idea.

## Core Ideas

### Stratified Design

Stratified design organizes code into layers of meaning. A high-level function
should read like the story of the feature. It should call functions that are
roughly one conceptual level lower, not jump directly into low-level details.

### Levels

Levels are about vocabulary, not file paths.

- Top level: feature intent, such as `checkout`, `sendWeeklyReport`.
- Domain level: business concepts, such as `priceCart`, `validateCart`,
  `buildReceipt`.
- Detail level: loops, formatting, rounding, field checks, string assembly.
- External action level: fetch, save, log, clock, random, storage.

### Directness

A function has directness when each line belongs to the same level of meaning.
Mixed levels make readers hold the feature story and implementation details in
their head at the same time.

### One Level Down

A caller often reads best when it calls helpers one level below it. This is a
guideline, not a rigid law. A tiny low-level detail can stay inline if naming it
would add noise.

### Wrappers

A wrapper creates a missing middle-level concept. Useful wrappers hide repeated
or distracting detail behind a name the caller already wants to say.

Bad wrappers merely rename a single obvious operation or hide too little to
earn their existence.

### API From The Caller

Good function design starts from the caller's vocabulary. If the caller wants to
say `applyFreeShipping(cart)`, a helper named `ifTotalGreaterThan50SetZero()`
is probably too low-level.

### Placement

Put functions near the level that names them. A function named in domain terms
belongs with domain calculations, even if its body contains low-level operations.

## Per-Lesson Notes

### Lesson 1 - Levels

Done when the learner can sort lines into high-level intent versus low-level
detail and explain that both can be calculations.

### Lesson 2 - Call Graph

Done when the learner can draw or describe the call graph and name at least
three levels. `checkout` should sit above validation/pricing/receipt helpers,
which sit above detail helpers.

### Lesson 3 - Leaks

The top function leaks formatting and rounding details. Done when the learner
identifies the leak by level, not just by line count.

### Lesson 4 - Wrap

The repeated item subtotal loop wants a wrapper such as `itemSubtotal` or
`lineTotal`. Done when the learner invents a middle-level name and uses it.

### Lesson 5 - Split

The mixed function validates, prices, formats, and logs. Done when the learner
extracts at least two coherent helpers without changing behavior.

### Lesson 6 - One Down

The caller jumps from feature intent to field checks. Done when the learner
inserts a domain-level helper so the top function mostly calls one level down.

### Lesson 7 - Judgment

Some helpers are useful; some are noise. Done when the learner rejects at least
one bad helper and explains why it does not improve the caller.

### Lesson 8 - API

Done when the learner designs helper signatures from the caller story, then
fills in plausible bodies.

### Lesson 9 - Move

Done when the learner moves or groups functions according to level and can
justify the order a reader should encounter them.

### Lesson 10 - Capstone

Done when the module has a readable top function, domain helpers, detail helpers,
and thin action boundaries. Exact decomposition may vary.
