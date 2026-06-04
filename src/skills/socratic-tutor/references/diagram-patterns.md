# Diagram Patterns by Problem Type

Always use Mermaid diagrams. Always leave the critical unknown as a `?` node.
The diagram shows **structure**, never **solution**.

---

## Math — Arithmetic / Equation

Show the components of the equation as a tree. Leave the result as `?`.

```mermaid
graph TD
    A["What we know: 4 × 3"] --> B["× means groups of..."]
    A --> C["4 groups of ?"]
    C --> D["? total"]
```

Ask after: *"Looking at this — what does the × sign tell us to do?"*

---

## Math — Word Problem

Extract knowns, unknowns, and the relationship between them.

```mermaid
graph LR
    K["Known: 12 apples, 3 friends"] --> R["Relationship: ?"]
    R --> U["Unknown: apples per friend = ?"]
```

Ask after: *"What operation connects 'groups' to 'total'?"*

---

## Math — Order of Operations

Show the expression as a step-by-step tree, with the final step blank.

```mermaid
graph TD
    E["Expression: 2 + 3 × 4"] --> S1["Step 1: Which part goes first?"]
    S1 --> S2["3 × 4 = ?"]
    S2 --> S3["2 + ? = ?"]
```

Ask after: *"Why does one part have to come before the other?"*

---

## Science — Newton's 3rd Law / Force Pairs

Show two objects and the forces between them. Leave the direction/magnitude of the reaction force as `?`.

```mermaid
graph LR
    A["Object 1\n(you)"] --"pushes with force F →"--> B["Object 2\n(wall)"]
    B --"pushes back with force ?"--> A
    note1["Same object? No — different objects"] -.-> A
    note2["Do the forces cancel? ?"] -.-> B
```

Ask after: *"The arrows go in opposite directions — what do you notice about where each arrow starts and ends?"*

---

## Science — Cause and Effect

Build a causal chain. Leave the final effect as `?`.

```mermaid
graph LR
    A["Sun heats water"] --> B["Water evaporates"]
    B --> C["Water vapor rises"]
    C --> D["?"]
```

Ask after: *"What do you think happens when lots of water vapor collects in one place?"*

---

## Science — Concept Mind Map

Place the concept at the center. Show its components as branches. Leave one branch as `?`.

```mermaid
mindmap
  root((Photosynthesis))
    Inputs
      Sunlight
      Water
      CO₂
    Outputs
      Oxygen
      ?
    Where it happens
      Leaves
      Chlorophyll
```

Ask after: *"What do you think the plant is making for itself from all those inputs?"*

---

## History / Social Studies — Timeline / Cause Chain

Show events as nodes. Leave the outcome node as `?`.

```mermaid
graph LR
    A["Event: Drought for 3 years"] --> B["Crops fail"]
    B --> C["People run out of food"]
    C --> D["?"]
```

Ask after: *"What usually happens when a large group of people can't get food?"*

---

## Reading Comprehension — Passage Breakdown

Label each section of the passage structurally.

```
[Section 1 — Setup]
"It was a dark and stormy night..."
→ What is being introduced here?

[Section 2 — Problem/Conflict]
"Suddenly the lights went out..."
→ What changed? Why does it matter?

[Section 3 — Detail]
"She reached for the flashlight..."
→ What does this tell us about the character?

[Question]
"Why did she reach for the flashlight instead of leaving?"
→ What do YOU think the reason is, based on what you read?
```

Ask after: *"Before we answer the question — what kind of person does the author want us to think she is?"*

---

## Coding — Bug / Logic Problem

Show the intended flow vs. what the code actually does.

```mermaid
graph TD
    I["Input: x = 5"] --> E["Code runs: x + 2"]
    E --> O["Expected output: 7"]
    O --> A["Actual output: ?"]
    A --> Q["Where does the path diverge?"]
```

Ask after: *"At which step does what the code does stop matching what you expected?"*

---

## General — Unknown Problem Type

When the problem doesn't fit a category, use this structure:

```mermaid
graph TD
    P["The Problem"] --> K["What we KNOW"]
    P --> U["What we DON'T know yet = ?"]
    K --> R["What's the relationship between them?"]
    R --> S["How do we get from KNOW → ?"]
```

Ask after: *"Looking at this — which of the 'known' pieces feels most useful to start with?"*
