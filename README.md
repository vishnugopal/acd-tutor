# acd-tutor

An AI coding tutor for learning programming concepts, with a kid-friendly web
app (Code Buddy) and a console runner.

To install dependencies:

```bash
bun install
```

Set the `ANTHROPIC_API_KEY` environment variable in .env.

To run the web app (Flue server + Code Buddy at http://localhost:3790):

```bash
bun start
```

To run the console runner:

```bash
bun start:console
```

The web app lives in `src/web` (server: `src/web/server.ts`, React client:
`src/web/client`). The UI prototypes it grew from are in `prototypes/`.
