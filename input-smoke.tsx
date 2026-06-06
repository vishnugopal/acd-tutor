import { runConsole } from "./src/console";

await runConsole({
  reply: async function* (line) {
    yield `echo: [${line}]`;
  },
  greeting: "input smoke test",
  actions: [{ label: "Check my work", message: "CHECK" }],
});
