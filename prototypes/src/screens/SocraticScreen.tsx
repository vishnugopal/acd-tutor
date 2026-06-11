import { useRef, useState } from "react";
import { AppBar } from "../components/AppBar";
import { CodeBuddyLogo } from "../components/CodeBuddyLogo";
import { Mascot } from "../components/Mascot";
import { Toast } from "../components/Toast";
import { ChatPanel } from "../components/chat/ChatPanel";
import { SOCRATIC_LESSON } from "../data/socraticLesson";
import { useScriptedChat } from "../hooks/useScriptedChat";
import { useToast } from "../hooks/useToast";
import { burstConfetti } from "../lib/effects";
import { useGameState } from "../state/GameStateContext";
import type { MascotMood } from "../types";

export function SocraticScreen({ onExit }: { onExit: () => void }) {
  const game = useGameState();
  const { toast, showToast } = useToast();
  const [mood, setMood] = useState<MascotMood>("idle");
  const cardRef = useRef<HTMLDivElement>(null);

  const chat = useScriptedChat({
    opening: SOCRATIC_LESSON.chat.opening,
    script: SOCRATIC_LESSON.chat.script,
    onStep: (index, { pushTutorMessage }) => {
      setMood("idle");
      if (index === SOCRATIC_LESSON.diagramAfterStep) {
        pushTutorMessage(SOCRATIC_LESSON.diagram, "diagram");
      }
    },
    onScriptEnd: () => {
      burstConfetti(cardRef.current, 40);
      game.addXp(SOCRATIC_LESSON.xpReward);
      setMood("cheer");
      setTimeout(() => setMood("idle"), 2600);
      showToast(`Insight unlocked ✓ <b>+${SOCRATIC_LESSON.xpReward} xp</b>`);
    },
  });

  return (
    <section className="screen flex flex-1 flex-col animate-[fadeup_.4s_ease_both]">
      <AppBar brand={<CodeBuddyLogo subtitle="Wonder mode" />} onBack={onExit} />

      <div className="soc-wrap mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col px-4 pb-4">
        <div
          className="soc-card mt-[14px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-panel"
          ref={cardRef}
        >
          <div className="soc-head flex items-center gap-3 border-b border-line px-4 py-[14px]">
            <Mascot mood={mood} className="h-12 w-[52px]" />
            <div>
              <h2 className="text-[17px] font-extrabold">
                {SOCRATIC_LESSON.title}
              </h2>
              <p className="text-[13px] text-muted">
                {SOCRATIC_LESSON.houseRule}
              </p>
            </div>
          </div>
          <ChatPanel
            messages={chat.messages}
            isTyping={chat.isTyping}
            onSend={(text) => {
              chat.send(text);
              setMood("think");
            }}
            placeholder="What are you wondering about?"
          />
        </div>
      </div>

      <Toast message={toast} />
    </section>
  );
}
