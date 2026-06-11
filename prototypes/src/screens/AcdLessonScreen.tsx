import { useRef, useState } from "react";
import { AppBar } from "../components/AppBar";
import { PrimaryButton } from "../components/Button";
import { Mascot } from "../components/Mascot";
import { Toast } from "../components/Toast";
import { ChatPanel } from "../components/chat/ChatPanel";
import { ChatSheet } from "../components/chat/ChatSheet";
import { CodeEditor } from "../components/lesson/CodeEditor";
import { SummaryOverlay } from "../components/lesson/SummaryOverlay";
import { ACD_LESSON } from "../data/acdLesson";
import { CURRENT_LESSON } from "../data/course";
import { useScriptedChat } from "../hooks/useScriptedChat";
import { useToast } from "../hooks/useToast";
import { checkCode, countMarked } from "../lib/checkLesson";
import { burstConfetti, floatLabel } from "../lib/effects";
import { useGameState } from "../state/GameStateContext";
import type { LessonSummary, MascotMood } from "../types";

export function AcdLessonScreen({ onExit }: { onExit: () => void }) {
  const game = useGameState();
  const { toast, showToast } = useToast();

  const [code, setCode] = useState(ACD_LESSON.initialCode);
  const [mood, setMood] = useState<MascotMood>("idle");
  const [unread, setUnread] = useState(true); // opening tutor message
  const [summary, setSummary] = useState<LessonSummary | null>(null);
  const [done, setDone] = useState(false);

  const firstCheckRef = useRef<number | null>(null);
  const moodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenRef = useRef<HTMLElement>(null);
  const statusbarRef = useRef<HTMLDivElement>(null);
  const checkBtnRef = useRef<HTMLButtonElement>(null);

  const chat = useScriptedChat({
    opening: ACD_LESSON.chat.opening,
    script: ACD_LESSON.chat.script,
  });

  const markedCount = countMarked(code, ACD_LESSON.lines);

  function setMoodFor(next: MascotMood, ms: number) {
    setMood(next);
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
    moodTimerRef.current = setTimeout(() => setMood("idle"), ms);
  }

  function handleCheck() {
    if (done) return;
    const outcome = checkCode(code, ACD_LESSON.lines);
    firstCheckRef.current ??= outcome.correctCount;

    if (outcome.perfect) {
      handlePass();
    } else {
      handleFail(outcome.correctCount, outcome.hint!);
    }
  }

  function handlePass() {
    setDone(true);
    burstConfetti(statusbarRef.current, 60);
    floatLabel(`+${ACD_LESSON.xpReward} xp`, checkBtnRef.current);
    game.addXp(ACD_LESSON.xpReward);
    game.bumpStreak();
    game.completeLesson(CURRENT_LESSON);
    setMoodFor("cheer", 3000);
    showToast("Build passed ✓ <b>Lesson complete</b>");
    chat.pushTutorMessage(ACD_LESSON.successMessage);

    const accuracy = Math.round(
      ((firstCheckRef.current ?? 0) / ACD_LESSON.lines.length) * 100,
    );
    setTimeout(() => {
      setSummary({
        xpEarned: ACD_LESSON.xpReward,
        accuracy,
        streak: game.streak + 1,
      });
    }, 1300);
  }

  function handleFail(correctCount: number, hint: string) {
    screenRef.current?.classList.add("shake");
    setTimeout(() => screenRef.current?.classList.remove("shake"), 350);
    game.loseHeart();
    setMoodFor("think", 3000);
    showToast(
      `Build failed · ${correctCount}/${ACD_LESSON.lines.length} — Beep left you a hint 💬`,
    );
    chat.pushTutorMessage(hint);
    setUnread(true);
  }

  return (
    <section
      className="screen flex flex-1 flex-col animate-[fadeup_.4s_ease_both]"
      ref={screenRef}
    >
      <AppBar
        brand={
          <span className="brand flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.01em] whitespace-nowrap">
            {ACD_LESSON.fileName}
          </span>
        }
        onBack={onExit}
        showHearts={false}
      />

      <div className="ide-main flex min-h-0 flex-1 flex-col min-[900px]:flex-row">
        <div className="ide-left flex min-h-0 min-w-0 flex-1 flex-col">
          {/* extra top padding gives the peeking mascot headroom below the
              sticky appbar */}
          <div className="tabbar relative flex items-end gap-1 px-4 pt-4">
            <div
              className={`ftab ${done ? "done" : ""} flex items-center gap-2 rounded-t-[10px] border border-b-0 border-line bg-white px-4 py-[9px] font-mono text-[12.5px]`}
            >
              <span
                className={`dot size-2 rounded-full ${done ? "bg-success" : "bg-cy-amber"}`}
              />{" "}
              {ACD_LESSON.fileName}
            </div>
            <Mascot
              mood={mood}
              className="tab-mascot pointer-events-none absolute right-[22px] -bottom-[3px] z-[5] h-[50px] w-[53px]"
            />
          </div>

          <div className="editor-shell mx-4 flex min-h-0 flex-1 flex-col border border-line bg-white">
            <div className="task-strip flex items-center gap-2 border-b border-[#f3e3bb] bg-cy-amber-soft px-[14px] py-2 text-[13.5px] text-[#6e5212] [&_code]:rounded-[5px] [&_code]:border [&_code]:border-[#f3e3bb] [&_code]:bg-white [&_code]:px-[5px] [&_code]:font-mono [&_code]:text-xs">
              🎯 Replace each <code>// ?</code> with <code>// A</code> (action)
              or <code>// ok</code> (pure) — lines tint as you mark them.
            </div>
            <CodeEditor value={code} onChange={setCode} />
          </div>

          <div
            className="statusbar mx-4 flex items-center gap-[14px] rounded-b-xl bg-brand-slate px-[14px] py-[7px] font-mono text-[11.5px] text-[#e7f0ed]"
            ref={statusbarRef}
          >
            <span>⎇ lesson-3</span>
            <span className="scan text-cy-yellow">
              {markedCount}/{ACD_LESSON.lines.length} marked
            </span>
            <span className="flex-1" />
            <span className="hearts tracking-[2px] text-[#ffb8a0]">
              {Array.from({ length: game.maxHearts }, (_, i) => (
                <span key={i} className={i < game.hearts ? "" : "off opacity-35"}>
                  ♥
                </span>
              ))}
            </span>
          </div>

          <div className="btn-row flex gap-[10px] px-4 pt-[14px] pb-4">
            <PrimaryButton
              className="flex-1"
              onClick={handleCheck}
              ref={checkBtnRef}
            >
              ▶ Check my work
            </PrimaryButton>
          </div>
        </div>

        <ChatSheet
          label="Chat with Beep"
          unread={unread}
          onOpen={() => setUnread(false)}
        >
          <ChatPanel
            messages={chat.messages}
            isTyping={chat.isTyping}
            onSend={(text) => {
              chat.send(text);
              setMoodFor("think", 1100);
            }}
            placeholder="Ask Beep about the code…"
          />
        </ChatSheet>
      </div>

      <Toast message={toast} />

      {summary && (
        <SummaryOverlay
          fileName={ACD_LESSON.fileName}
          summary={summary}
          onContinue={onExit}
        />
      )}
    </section>
  );
}
