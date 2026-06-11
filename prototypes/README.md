# Code Buddy — web tutor prototype

Interactive React prototype of the tutor web runner. **Standalone** — not wired
to the Flue server yet; all tutor behavior is scripted dummy data so the
interactions can be refined before integration.

```sh
bun install
bun start      # dev server with HMR at http://localhost:3000
bun test       # unit tests for the lesson-check logic
bun typecheck
```

## What it does

- **Home**: course stepper (7 ACD lessons), two lesson cards, XP/streak/hearts.
- **ACD lesson** (`lesson-3.ts`, the Line Hunt): a real CodeMirror 6 editor
  (light GitHub theme, TypeScript highlighting). Marking a line `// A` or
  `// ok` tints it live. *Check my marks* grades the code — wrong answers cost
  a heart and push a targeted Socratic hint into chat; a perfect check
  celebrates and advances course progress.
- **Socratic mode**: chat-only guided-discovery script ("why is the sky
  blue?") with a diagram message and an XP reward at the aha-moment.
- Chat is a docked side panel on desktop (≥900px) and a slide-up bottom sheet
  on mobile.

## Structure (concerns kept separate)

```
src/
  data/        dummy lesson content & scripts — swap for server data later
  lib/         pure logic: checkLesson (graded + tested), CM extension, fx
  state/       GameStateContext — XP/streak/hearts/progress
  hooks/       useScriptedChat (the future agent-session seam), useToast
  components/  presentational: AppBar, Mascot, Toast, Button, chat/, lesson/
  screens/     HomeScreen, AcdLessonScreen, SocraticScreen
  styles/      global.css — Tailwind v4 theme tokens (Codeyoung palette) plus
               the few CSS-only bits: keyframes, the mascot's SVG animation
               rig, CodeMirror internals, imperative effect classes
```

Integration seams for later:

- `useScriptedChat.send()` → replace with the Flue agent-session `send()`
  (streaming chunks land as tutor messages).
- `data/*` → fetch lesson files/specs from the server.
- `CodeEditor` exposes its `EditorView` on the host node (`__cmView`) so
  tutor-driven file writes can update the document programmatically.

Styling is Tailwind CSS v4, processed by `bun-plugin-tailwind` via
`bunfig.toml` — `global.css` must stay linked from `index.html` (not imported
from TSX) for the plugin to pick it up. Brand palette is sampled from
codeyoung.com (logo mark + site CSS): yellow `#ffeb00`, amber `#ffb600`,
orange `#ff712d`, blue `#2e5cff`, slate `#2f4f4f`, exposed as utilities like
`bg-cy-amber` / `text-ink` through `@theme` tokens.
