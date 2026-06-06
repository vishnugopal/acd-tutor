/** A persistent button rendered above the input line; pressing it sends `message`. */
export interface ConsoleAction {
  /** Button label, e.g. "Check my work". */
  label: string;
  /** The message sent to `reply` when the button is pressed. */
  message: string;
}

export interface ConsoleOptions {
  /** Produces the streamed reply for one submitted line. */
  reply: (line: string) => AsyncIterable<string>;
  /** Shown once at the top of the transcript. */
  greeting?: string;
  /** Printed after the UI exits. */
  farewell?: string;
  /** Shown when a reply yields no text. */
  emptyReplyMessage?: string;
  /** Indicator shown while waiting for the first reply chunk. */
  thinkingIndicator?: string;
  /** Formats a reply error for display. */
  formatError?: (err: unknown) => string;
  /** Always-visible action buttons above the input line. */
  actions?: ConsoleAction[];
}

/** One completed transcript entry. */
export interface Message {
  role: "user" | "tutor" | "error" | "info";
  text: string;
}
