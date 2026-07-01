---
name: css-zoom-dvh-vh100
description: "Web app uses CSS zoom for global scaling; full-height screens must use var(--vh100), not dvh"
metadata: 
  node_type: memory
  type: project
  originSessionId: d639a639-8b3d-4a5b-aba2-44f718050fea
---

The web client applies an app-wide CSS `zoom` (`html { zoom: var(--app-zoom) }`
in `src/web/client/styles/global.css`) to scale the whole UI as one unit.

**Gotcha:** CSS `zoom` scales an element's box *after* layout, but `dvh`/`vh`
resolve against the real (unzoomed) viewport — so a `100dvh` element renders at
`100dvh × zoom` of physical space and overflows (e.g. the lesson screen pushed
the Send button below the fold). Browser page-zoom doesn't do this because it
shrinks the viewport itself.

**How to apply:** For any full-viewport height, use `var(--vh100)` (defined in
global.css as `calc(100dvh / var(--app-zoom))`), never a raw `dvh` utility.
Tailwind: `h-[var(--vh100)]`, `min-h-[var(--vh100)]`, etc. Current usages:
`App.tsx` (min-h), `ChatLessonScreen.tsx`, `IdeLessonScreen.tsx`; the mobile
`ChatSheet.tsx` uses `calc(62dvh/var(--app-zoom))`. It self-adjusts to whatever
`--app-zoom` is set to.
