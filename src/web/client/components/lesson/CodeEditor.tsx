import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { githubLight } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import { markedLineHighlighter } from "../../lib/cmMarkedLines";

/**
 * The lesson code editor: CodeMirror 6 with a light (GitHub) theme,
 * TypeScript syntax highlighting, and live tinting of `// A` / `// ok` lines.
 * CodeMirror's internal DOM is styled in global.css under `.editor-host`.
 */
export function CodeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const extensions = useMemo(
    () => [
      javascript({ typescript: true }),
      markedLineHighlighter,
      EditorView.lineWrapping,
    ],
    [],
  );

  return (
    <div className="editor-host min-h-[280px] flex-1 overflow-auto bg-code-bg">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={githubLight}
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          autocompletion: false,
          searchKeymap: false,
        }}
      />
    </div>
  );
}
