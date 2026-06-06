import { render } from "ink";
import { App } from "./App";
import type { ConsoleOptions } from "./types";

export type { ConsoleAction, ConsoleOptions } from "./types";

/**
 * Runs the Ink chat UI until the user exits (`exit`/`quit` or Ctrl+C);
 * resolves when the UI unmounts. Generic: the reply source is whatever
 * `options.reply` yields.
 */
export async function runConsole(options: ConsoleOptions): Promise<void> {
  const {
    reply,
    greeting,
    farewell,
    emptyReplyMessage = "(No reply.)",
    thinkingIndicator = "thinking…",
    formatError = (err) =>
      `[error] ${err instanceof Error ? err.message : err}`,
    actions = [],
  } = options;

  const { waitUntilExit } = render(
    <App
      reply={reply}
      greeting={greeting}
      emptyReplyMessage={emptyReplyMessage}
      thinkingIndicator={thinkingIndicator}
      formatError={formatError}
      actions={actions}
    />,
  );
  await waitUntilExit();

  if (farewell !== undefined) console.log(`\n${farewell}`);
}
