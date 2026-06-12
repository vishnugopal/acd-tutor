import { useCallback, useEffect, useState } from "react";
import { clearLessonFiles, readLessonFile } from "../api";
import { LessonScreenShell } from "../components/LessonScreenShell";
import { Mascot } from "../components/Mascot";
import { Toast } from "../components/Toast";
import { ChatPanel } from "../components/chat/ChatPanel";
import { ChatSheet } from "../components/chat/ChatSheet";
import { CodeEditor } from "../components/lesson/CodeEditor";
import { FileTabs } from "../components/lesson/FileTabs";
import { MarkdownEditor } from "../components/lesson/MarkdownEditor";
import type { EditorKind } from "../data/agents";
import { STATIC_GAME } from "../data/gamification";
import { useAgentChat } from "../hooks/useAgentChat";
import { useAutosave } from "../hooks/useAutosave";
import { useLessonFileSync } from "../hooks/useLessonFileSync";
import { useToast } from "../hooks/useToast";
import type { SaveState } from "../lib/autosave";
import type { AgentInfo } from "../types";

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "",
  unsaved: "● editing…",
  saving: "saving…",
  saved: "saved ✓",
  error: "⚠ couldn't save",
};

const TASK_STRIP_COPY: Record<EditorKind, string> = {
  code: "🎯 Work right here in the editor — it saves by itself. When you're done, ask Beep to check it!",
  markdown:
    "✍️ Write right here in your workbook — it saves by itself. When you're ready, ask Beep to read it!",
};

/**
 * The workbook lesson screen (ACD + essay tutors): a real editor over the
 * lesson files the tutor manages, plus live chat. `editorKind` picks the
 * editor (CodeMirror for .ts lessons, MDXEditor for .md essays). Autosave
 * lives in useAutosave, workspace syncing in useLessonFileSync — this
 * component is layout plus the wiring between them.
 */
export function IdeLessonScreen({
  agent,
  editorKind,
  onExit,
}: {
  agent: AgentInfo;
  editorKind: EditorKind;
  onExit: () => void;
}) {
  const { toast, showToast } = useToast();
  const [active, setActive] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [unread, setUnread] = useState(true); // greeting arrives unread

  const autosave = useAutosave({ agentId: agent.id, file: active, content: code });
  const { flush, markSaved } = autosave;

  const openFile = useCallback(
    async (name: string) => {
      const content = await readLessonFile(agent.id, name);
      if (content === null) return;
      markSaved(content);
      setCode(content);
      setActive(name);
    },
    [agent.id, markSaved],
  );

  const { files, sync, resetFiles } = useLessonFileSync(agent.id, {
    snapshot: () => ({ active, dirty: autosave.isDirty, content: code }),
    flush,
    open: openFile,
    replace: (content) => {
      markSaved(content);
      setCode(content);
    },
    toast: showToast,
  });

  const chat = useAgentChat({
    agentId: agent.id,
    greeting: agent.greeting,
    onReplyDone: () => {
      setUnread(true);
      void sync();
    },
  });

  // Initial load of whatever workspace already exists.
  useEffect(() => {
    void sync();
  }, [sync]);

  /** Flush the pending edit before switching files — and stay if it fails. */
  const handleSelectFile = useCallback(
    async (name: string) => {
      if (name === active) return;
      if (!(await flush())) {
        showToast("⚠️ Couldn't save your work — staying on this file.");
        return;
      }
      await openFile(name);
    },
    [active, flush, openFile, showToast],
  );

  /** Wipe the workspace + conversation so the tutor restarts at lesson 1. */
  const handleStartFromScratch = useCallback(async () => {
    await clearLessonFiles(agent.id).catch(() => {});
    chat.reset();
    resetFiles();
    setActive(null);
    setCode("");
    markSaved("");
    setUnread(true);
    showToast("🌱 Fresh start! Say hi to Beep to begin lesson 1.");
  }, [agent.id, chat, markSaved, resetFiles, showToast]);

  const mood = chat.isBusy ? "think" : "idle";
  const hasWorkspace = files.length > 0;

  return (
    // Desktop: lock the screen to the viewport so the chat dock keeps a fixed
    // height and scrolls internally instead of growing with the transcript.
    <LessonScreenShell
      className="screen flex flex-1 flex-col animate-[fadeup_.4s_ease_both] min-[900px]:h-dvh min-[900px]:max-h-dvh min-[900px]:overflow-hidden"
      brand={
        <span className="brand flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.01em] whitespace-nowrap">
          {agent.label}
        </span>
      }
      onExit={onExit}
      showHearts={false}
      busy={chat.isBusy}
      confirmText="Start over from lesson 1? Your lesson files and this chat will be cleared."
      onStartFromScratch={() => void handleStartFromScratch()}
      debugMode={chat.debugMode}
      onToggleDebug={chat.toggleDebug}
    >
      <div className="ide-main flex min-h-0 flex-1 flex-col min-[900px]:flex-row">
        <div className="ide-left flex min-h-0 min-w-0 flex-1 flex-col">
          {/* extra top padding gives the peeking mascot headroom below the
              sticky appbar */}
          <div className="tabbar relative flex items-end gap-1 overflow-x-auto px-4 pt-4">
            <FileTabs files={files} active={active} onSelect={handleSelectFile} />
            {!hasWorkspace && (
              <div className="ftab flex items-center gap-2 rounded-t-[10px] border border-b-0 border-line bg-white px-4 py-[9px] font-mono text-[12.5px] text-muted">
                <span className="dot size-2 rounded-full bg-line" /> no lesson yet
              </div>
            )}
            <Mascot
              mood={mood}
              className="tab-mascot pointer-events-none absolute right-[22px] -bottom-[3px] z-[5] h-[50px] w-[53px]"
            />
          </div>

          <div className="editor-shell mx-4 flex min-h-0 flex-1 flex-col border border-line bg-white">
            {hasWorkspace && active ? (
              <>
                <div className="task-strip flex items-center gap-2 border-b border-[#f3e3bb] bg-cy-amber-soft px-[14px] py-2 text-[13.5px] text-[#6e5212]">
                  {TASK_STRIP_COPY[editorKind]}
                </div>
                {editorKind === "markdown" ? (
                  <MarkdownEditor value={code} onChange={setCode} />
                ) : (
                  <CodeEditor value={code} onChange={setCode} />
                )}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <Mascot mood={mood} className="h-[84px] w-[90px]" />
                <p className="max-w-[34ch] text-[15px] font-semibold text-ink">
                  No lesson yet! Say hi to Beep in the chat and your first
                  lesson will appear right here. ✨
                </p>
              </div>
            )}
          </div>

          <div className="statusbar mx-4 flex items-center gap-[14px] rounded-b-xl bg-brand-slate px-[14px] py-[7px] font-mono text-[11.5px] text-[#e7f0ed]">
            <span>⎇ {active ?? "—"}</span>
            <span className="scan text-cy-yellow">{SAVE_LABEL[autosave.saveState]}</span>
            <span className="flex-1" />
            <span className="hearts tracking-[2px] text-[#ffb8a0]">
              {Array.from({ length: STATIC_GAME.maxHearts }, (_, i) => (
                <span
                  key={i}
                  className={i < STATIC_GAME.hearts ? "" : "off opacity-35"}
                >
                  ♥
                </span>
              ))}
            </span>
          </div>

          <div className="h-[64px] min-[900px]:h-4" />
        </div>

        <ChatSheet
          label="Chat with Beep"
          unread={unread}
          onOpen={() => setUnread(false)}
        >
          <ChatPanel
            messages={chat.messages}
            streamingText={chat.streamingText}
            onSend={chat.send}
            actions={agent.actions}
            onAction={(action) => chat.send(action.message, action.label)}
            placeholder="Ask Beep about the code…"
          />
        </ChatSheet>
      </div>

      <Toast message={toast} />
    </LessonScreenShell>
  );
}
