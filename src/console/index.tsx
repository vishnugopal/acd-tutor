import { render } from "ink";
import { useEffect, useState } from "react";
import { App } from "./components/App";
import { Menu } from "./components/Menu";
import type { AgentChoice, ConsoleAction, ConsoleOptions } from "./types";

export type { AgentChoice, ConsoleAction, ConsoleOptions, ReplyChunk } from "./types";

interface RootProps extends Required<Pick<ConsoleOptions, "agents" | "createReply">> {
  resolveActions?: ConsoleOptions["resolveActions"];
  emptyReplyMessage: string;
  thinkingIndicator: string;
  formatError: (err: unknown) => string;
  /** Records the chosen agent so the farewell can be printed after exit. */
  onSelect: (choice: AgentChoice) => void;
}

/**
 * Shows the agent picker (skipped when there's only one), then the chat for the
 * chosen agent. Generic: it forwards the choice's presentation to App and asks
 * `createReply` for that agent's reply source.
 */
function Root({
  agents,
  createReply,
  resolveActions,
  emptyReplyMessage,
  thinkingIndicator,
  formatError,
  onSelect,
}: RootProps) {
  const [selected, setSelected] = useState<AgentChoice | null>(
    agents.length === 1 ? agents[0]! : null,
  );
  const [actionRevision, setActionRevision] = useState(0);
  const [actions, setActions] = useState<ConsoleAction[]>(
    () => selected?.actions ?? [],
  );

  const choose = (choice: AgentChoice) => {
    onSelect(choice);
    setSelected(choice);
    setActions(choice.actions ?? []);
  };

  useEffect(() => {
    if (selected === null) return;
    let cancelled = false;
    const fallback = selected.actions ?? [];
    setActions(fallback);
    if (resolveActions === undefined) return;

    void Promise.resolve(resolveActions(selected))
      .then((next) => {
        if (!cancelled) setActions(next);
      })
      .catch(() => {
        if (!cancelled) setActions(fallback);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, resolveActions, actionRevision]);

  // agents.length === 1 auto-selects above, so this also runs onSelect once.
  if (selected === null) {
    return <Menu choices={agents} onSelect={choose} />;
  }

  return (
    <App
      reply={createReply(selected.id)}
      greeting={selected.greeting}
      actions={actions}
      onReplyDone={
        resolveActions === undefined
          ? undefined
          : () => setActionRevision((n) => n + 1)
      }
      emptyReplyMessage={emptyReplyMessage}
      thinkingIndicator={thinkingIndicator}
      formatError={formatError}
    />
  );
}

/**
 * Runs the Ink chat UI until the user exits (`/exit` or Ctrl+C); resolves when
 * the UI unmounts. Generic: it offers `options.agents` as a startup menu and
 * the reply source is whatever `options.createReply` yields.
 */
export async function runConsole(options: ConsoleOptions): Promise<void> {
  const {
    agents,
    createReply,
    emptyReplyMessage = "(No reply.)",
    thinkingIndicator = "thinking…",
    formatError = (err) =>
      `[error] ${err instanceof Error ? err.message : err}`,
  } = options;

  // Captured during render so the farewell of the chosen agent prints on exit.
  let chosen: AgentChoice | undefined;
  if (agents.length === 1) chosen = agents[0];

  const { waitUntilExit } = render(
    <Root
      agents={agents}
      createReply={createReply}
      resolveActions={options.resolveActions}
      emptyReplyMessage={emptyReplyMessage}
      thinkingIndicator={thinkingIndicator}
      formatError={formatError}
      onSelect={(choice) => {
        chosen = choice;
      }}
    />,
  );
  await waitUntilExit();

  if (chosen?.farewell !== undefined) console.log(`\n${chosen.farewell}`);
}
