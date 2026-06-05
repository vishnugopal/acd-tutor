import { createInterface } from "node:readline/promises";

export interface ConsoleOptions {
  /** Produces the streamed reply for one submitted line. */
  reply: (line: string) => AsyncIterable<string>;
  /** Printed once before the prompt loop starts. */
  greeting?: string;
  /** Printed after the loop exits. */
  farewell?: string;
  /** Printed when a reply yields no text. */
  emptyReplyMessage?: string;
  /** Indicator shown (TTY only) while waiting for the first reply chunk. */
  thinkingIndicator?: string;
  /** Formats a reply error for display. */
  formatError?: (err: unknown) => string;
}

/**
 * Streams one reply to stdout as it is generated. `onFirstOutput` fires just
 * before the first printed chunk (used to clear the thinking indicator).
 */
async function printReply(
  chunks: AsyncIterable<string>,
  emptyReplyMessage: string,
  onFirstOutput: () => void,
): Promise<void> {
  let printed = false;
  for await (const text of chunks) {
    if (!printed) {
      onFirstOutput();
      process.stdout.write("\n");
      printed = true;
    }
    process.stdout.write(text);
  }
  if (printed) process.stdout.write("\n\n");
  else {
    onFirstOutput();
    console.log(`\n${emptyReplyMessage}\n`);
  }
}

/**
 * Runs a streaming REPL over stdin/stdout until EOF or `exit`/`quit`;
 * resolves when the loop ends. Generic: the reply source is whatever
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
  } = options;

  if (greeting !== undefined) {
    console.log();
    console.log(greeting);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // The async iterator (unlike rl.question) buffers lines that arrive while a
  // reply is still pending, so piped input and fast typers don't lose messages.
  rl.setPrompt("> ");
  rl.prompt();
  for await (const input of rl) {
    const line = input.trim();
    if (!line) {
      rl.prompt();
      continue;
    }
    if (line === "exit" || line === "quit") break;

    const tty = process.stdout.isTTY;
    if (tty) process.stdout.write(thinkingIndicator);
    let cleared = !tty;
    const clearIndicator = () => {
      if (!cleared) process.stdout.write("\r\x1b[K");
      cleared = true;
    };
    try {
      await printReply(reply(line), emptyReplyMessage, clearIndicator);
    } catch (err) {
      clearIndicator();
      console.error(formatError(err));
    }
    rl.prompt();
  }

  if (farewell !== undefined) console.log(`\n${farewell}`);
  rl.close();
}
