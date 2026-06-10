import {
  fauxAssistantMessage,
  fauxText,
  fauxToolCall,
  getApiProvider,
  registerFauxProvider,
} from "@earendil-works/pi-ai";
import { registerApiProvider, registerProvider } from "@flue/runtime";

/** Provider/model id the faux tutor registers and resolves against. */
export const FAUX_TUTOR_MODEL = "acd-faux/tutor";

/**
 * Registers a scripted (faux) model the tutor agent can run against offline —
 * no Anthropic key, deterministic output. Used by the e2e suite via the
 * `tutor-faux` agent shim.
 *
 * Must run at module top-level (server boot), not inside a createAgent
 * initializer: pi-ai's registry is module-scoped and the initializer runs in
 * an isolate the streaming runtime doesn't share. There's also a two-instance
 * wrinkle — @flue/runtime and the app bundle resolve @earendil-works/pi-ai to
 * separate module instances. registerFauxProvider installs the stream handler
 * into this bundle's pi-ai, so we lift it out and re-register through Flue's
 * re-exported registerApiProvider (the instance Flue streams from);
 * registerProvider then makes the model resolvable.
 *
 * Scripted exchange: write the first lesson file, then reply.
 */
export function registerFauxTutorProvider(): string {
  const faux = registerFauxProvider({
    api: "acd-faux",
    provider: "acd-faux",
    models: [{ id: "tutor" }],
  });
  // Cast across the two pi-ai instances: the handler is structurally identical
  // but nominally typed against this bundle's pi-ai, while registerApiProvider
  // expects Flue's. (This instance split is the whole reason for the re-register.)
  const fauxApi = getApiProvider("acd-faux") as Parameters<typeof registerApiProvider>[0] | undefined;
  if (fauxApi) registerApiProvider(fauxApi);
  registerProvider("acd-faux", { api: "acd-faux", baseUrl: "" });
  faux.setResponses([
    fauxAssistantMessage(
      fauxToolCall("writeFile", {
        filename: "lesson-1.ts",
        content: "// Lesson 1: classify each line as Action, Calculation, or Data.\n",
      }),
      { stopReason: "toolUse" },
    ),
    fauxAssistantMessage(
      fauxText("Created your first lesson — open lesson-1.ts to begin."),
    ),
  ]);
  return FAUX_TUTOR_MODEL;
}
