import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ListsToggle,
  MDXEditor,
  codeBlockPlugin,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
  useCodeBlockEditorContext,
  type CodeBlockEditorDescriptor,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useEffect, useRef } from "react";

/**
 * Catch-all plain-text editor for fenced code blocks. Essays shouldn't
 * contain code, but codeBlockPlugin must be registered anyway —
 * markdownShortcutPlugin's transformers reference the code-block node class
 * and crash on mount without it ("reading '$isCodeBlockNode'") — and this
 * keeps any fence the tutor emits editable instead of fatal.
 */
const plainTextCodeBlock: CodeBlockEditorDescriptor = {
  match: () => true,
  priority: 0,
  Editor: (props) => {
    const { setCode } = useCodeBlockEditorContext();
    return (
      <div
        // keep typing inside the block from triggering editor-level shortcuts
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        <textarea
          className="w-full resize-y rounded-lg border border-line bg-cream-soft p-2 font-mono text-[12.5px]"
          rows={Math.max(3, props.code.split("\n").length)}
          defaultValue={props.code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
    );
  },
};

/**
 * The essay lesson editor: MDXEditor (rich Markdown WYSIWYG) over the
 * tutor's lesson-N.md workbook files. Mirrors CodeEditor's contract:
 * controlled `value` + `onChange` markdown source.
 *
 * MDXEditor treats the `markdown` prop as initial-only, so external value
 * changes (file switches, tutor rewrites) are pushed in via setMarkdown.
 */
export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (markdown: string) => void;
}) {
  const editorRef = useRef<MDXEditorMethods>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getMarkdown() !== value) {
      editor.setMarkdown(value);
    }
  }, [value]);

  return (
    <div className="editor-host markdown-host min-h-[280px] flex-1 overflow-auto bg-code-bg">
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={onChange}
        contentEditableClassName="md-lesson-content"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin({
            defaultCodeBlockLanguage: "",
            codeBlockEditorDescriptors: [plainTextCodeBlock],
          }),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <ListsToggle />
                <BlockTypeSelect />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
