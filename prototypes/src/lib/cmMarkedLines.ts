import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { markOf } from "./checkLesson";

/**
 * CodeMirror extension: tints lines as the student marks them —
 * `// A` (action) red-ish, `// ok` (pure) green-ish. The colors live in CSS
 * under `.cm-line-action` / `.cm-line-pure` so the theme stays in one place.
 */

const actionLine = Decoration.line({ class: "cm-line-action" });
const pureLine = Decoration.line({ class: "cm-line-pure" });

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      const mark = markOf(line.text);
      if (mark === "ok") builder.add(line.from, line.from, pureLine);
      else if (mark === "A") builder.add(line.from, line.from, actionLine);
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

export const markedLineHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);
