import { Text } from "ink";
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";

// Note: ink-markdown is the same marked + marked-terminal pipeline, but it is
// published as CJS and can't load the ESM-only ink >=4, so we render directly.
const marked = new Marked(markedTerminal());

/** Renders markdown as ANSI-styled terminal text. */
export function Markdown({ children }: { children: string }) {
  return <Text>{(marked.parse(children) as string).trim()}</Text>;
}
