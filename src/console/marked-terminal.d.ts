// marked-terminal v7 ships no type declarations; cover the one export we use.
declare module "marked-terminal" {
  import type { MarkedExtension } from "marked";

  export function markedTerminal(
    options?: Record<string, unknown>,
    highlightOptions?: Record<string, unknown>,
  ): MarkedExtension;
}
