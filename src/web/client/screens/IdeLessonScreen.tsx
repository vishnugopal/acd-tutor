import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearLessonFiles,
  listLessonFiles,
  readLessonFile,
  takeOpenRequest,
  writeLessonFile,
} from "../api";
import { AppBar } from "../components/AppBar";
import { Mascot } from "../components/Mascot";
import { OptionsMenu } from "../components/OptionsMenu";
import { Toast } from "../components/Toast";
import { ChatPanel } from "../components/chat/ChatPanel";
import { ChatSheet } from "../components/chat/ChatSheet";
import { CodeEditor } from "../components/lesson/CodeEditor";
import { FileTabs } from "../components/lesson/FileTabs";
import { STATIC_GAME } from "../data/gamification";
import { useAgentChat } from "../hooks/useAgentChat";
import { useToast } from "../hooks/useToast";
import { lessonNumber, latestLessonFile, sortLessonFiles } from "../lib/lessonFiles";
import type { AgentInfo } from "../types";

const AUTOSAVE_DELAY_MS = 1000;

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "",
  unsaved: "● editing…",
  saving: "saving…",
  saved: "saved ✓",
  error: "⚠ couldn't save",
};

/**
 * The coding-lesson screen (ACD tutor): a real editor over the lesson files
 * the tutor manages, plus live chat. The editor autosaves once typing stops,
 * so when the student asks for feedback the tutor's readFile sees their
 * latest work — same loop as the console runner, minus the external $EDITOR.
 */
export function IdeLessonScreen({
  agent,
  onExit,
}: {
  agent: AgentInfo;
  onExit: () => void;
}) {
  const { toast, showToast } = useToast();

  const [files, setFiles] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [unread, setUnread] = useState(true); // greeting arrives unread

  // Refs mirror state the async callbacks need without re-subscribing.
  const codeRef = useRef(code);
  codeRef.current = code;
  const activeRef = useRef(active);
  activeRef.current = active;
  const savedRef = useRef(""); // last content known to be on disk

  const openFile = useCallback(async (name: string) => {
    const content = await readLessonFile(name);
    if (content === null) return;
    savedRef.current = content;
    setCode(content);
    setActive(name);
    setSaveState("idle");
  }, []);

  /** Flush a pending (debounced) edit so switching files never loses work. */
  const flushPendingSave = useCallback(async () => {
    const file = activeRef.current;
    if (file && codeRef.current !== savedRef.current) {
      await writeLessonFile(file, codeRef.current).catch(() => {});
      savedRef.current = codeRef.current;
    }
  }, []);

  /** Sync with the tutor's workspace after every reply (it may create/edit files). */
  const syncFiles = useCallback(async () => {
    const latest = sortLessonFiles(await listLessonFiles());
    setFiles(latest);

    // The tutor's openFile call (web mode) wins: open exactly that file.
    const requested = await takeOpenRequest().catch(() => null);
    if (requested && latest.includes(requested)) {
      if (requested !== activeRef.current) {
        await flushPendingSave();
        await openFile(requested);
        showToast(`📂 Beep opened ${requested} for you`);
        return;
      }
    }

    const newest = latestLessonFile(latest);
    const current = activeRef.current;
    const dirty = codeRef.current !== savedRef.current;

    if (!newest) return;
    if (current === null) {
      // First file just appeared — open it.
      await openFile(newest);
      showToast(`📂 ${newest} is ready — happy hunting!`);
      return;
    }
    const newer =
      newest !== current &&
      (lessonNumber(newest) ?? 0) > (lessonNumber(current) ?? 0);
    if (newer) {
      if (dirty) {
        // Don't yank unsaved work out from under the student.
        showToast(`📂 New lesson ready: ${newest}`);
      } else {
        await openFile(newest);
        showToast(`📂 ${newest} unlocked!`);
      }
      return;
    }
    if (!dirty) {
      // The tutor may have rewritten the current file (e.g. added comments).
      const content = await readLessonFile(current);
      if (content !== null && content !== savedRef.current) {
        savedRef.current = content;
        setCode(content);
      }
    }
  }, [flushPendingSave, openFile, showToast]);

  const chat = useAgentChat({
    agentId: agent.id,
    greeting: agent.greeting,
    onReplyDone: () => {
      setUnread(true);
      void syncFiles();
    },
  });

  // Initial load of whatever workspace already exists.
  useEffect(() => {
    void syncFiles();
  }, [syncFiles]);

  // Autosave: debounce while typing; save once the editor goes quiet.
  useEffect(() => {
    if (!active) return;
    if (code === savedRef.current) return;
    setSaveState("unsaved");
    const timer = setTimeout(async () => {
      const snapshot = codeRef.current;
      const file = activeRef.current;
      if (!file) return;
      setSaveState("saving");
      try {
        await writeLessonFile(file, snapshot);
        savedRef.current = snapshot;
        setSaveState(codeRef.current === snapshot ? "saved" : "unsaved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [code, active]);

  /** Flush any pending edit before switching files so nothing is lost. */
  const handleSelectFile = useCallback(
    async (name: string) => {
      if (name === activeRef.current) return;
      await flushPendingSave();
      await openFile(name);
    },
    [flushPendingSave, openFile],
  );

  /** Wipe the workspace + conversation so the tutor restarts at lesson 1. */
  const handleStartFromScratch = useCallback(async () => {
    if (chat.isBusy) return;
    const sure = window.confirm(
      "Start over from lesson 1? Your lesson files and this chat will be cleared.",
    );
    if (!sure) return;
    await clearLessonFiles().catch(() => {});
    chat.reset();
    setFiles([]);
    setActive(null);
    setCode("");
    savedRef.current = "";
    setSaveState("idle");
    setUnread(true);
    showToast("🌱 Fresh start! Say hi to Beep to begin lesson 1.");
  }, [chat, showToast]);

  const mood = chat.isBusy ? "think" : "idle";
  const hasWorkspace = files.length > 0;

  return (
    // Desktop: lock the screen to the viewport so the chat dock keeps a fixed
    // height and scrolls internally instead of growing with the transcript.
    <section className="screen flex flex-1 flex-col animate-[fadeup_.4s_ease_both] min-[900px]:h-dvh min-[900px]:max-h-dvh min-[900px]:overflow-hidden">
      <AppBar
        brand={
          <span className="brand flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.01em] whitespace-nowrap">
            {agent.label}
          </span>
        }
        onBack={onExit}
        showHearts={false}
        menu={
          <OptionsMenu
            items={[
              {
                label: "🌱 Start from scratch",
                onSelect: () => void handleStartFromScratch(),
                danger: true,
              },
            ]}
          />
        }
      />

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
                  🎯 Work right here in the editor — it saves by itself. When
                  you're done, ask Beep to check it!
                </div>
                <CodeEditor value={code} onChange={setCode} />
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
            <span className="scan text-cy-yellow">{SAVE_LABEL[saveState]}</span>
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
    </section>
  );
}
