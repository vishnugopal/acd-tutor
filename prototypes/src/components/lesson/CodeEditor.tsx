import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { githubLight } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";
import { useCallback, useMemo, useRef } from "react";
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
  const hostRef = useRef<HTMLDivElement>(null);

  const extensions = useMemo(
    () => [
      javascript({ typescript: true }),
      markedLineHighlighter,
      EditorView.lineWrapping,
    ],
    [],
  );

  // Expose the EditorView on the host node so headless tests (and later the
  // real tutor's file-write tooling) can drive the document programmatically.
  const handleCreateEditor = useCallback((view: EditorView) => {
    if (hostRef.current) {
      (hostRef.current as HTMLDivElement & { __cmView?: EditorView }).__cmView =
        view;
    }
  }, []);

  return (
    <div
      className="editor-host min-h-[280px] flex-1 overflow-auto bg-code-bg"
      ref={hostRef}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={githubLight}
        extensions={extensions}
        onCreateEditor={handleCreateEditor}
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
