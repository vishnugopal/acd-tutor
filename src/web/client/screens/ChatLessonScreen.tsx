import { AppBar } from "../components/AppBar";
import { CodeBuddyLogo } from "../components/CodeBuddyLogo";
import { Mascot } from "../components/Mascot";
import { OptionsMenu } from "../components/OptionsMenu";
import { ChatPanel } from "../components/chat/ChatPanel";
import { useAgentChat } from "../hooks/useAgentChat";
import type { AgentInfo } from "../types";

/**
 * Chat-only lesson screen (Socratic tutor): one full-height conversation
 * card. The tutor's diagrams (fenced ASCII/Mermaid) render as monospace
 * cards inside the transcript.
 */
export function ChatLessonScreen({
  agent,
  onExit,
}: {
  agent: AgentInfo;
  onExit: () => void;
}) {
  const chat = useAgentChat({
    agentId: agent.id,
    greeting: agent.greeting,
  });

  return (
    // Viewport-bounded so the conversation card keeps a fixed height and the
    // transcript scrolls inside it.
    <section className="screen flex h-dvh max-h-dvh flex-col overflow-hidden animate-[fadeup_.4s_ease_both]">
      <AppBar
        brand={<CodeBuddyLogo subtitle="Wonder mode" />}
        onBack={onExit}
        menu={
          <OptionsMenu
            items={[
              {
                label: "🌱 Start from scratch",
                onSelect: () => {
                  if (chat.isBusy) return;
                  if (window.confirm("Start a brand-new conversation? This chat will be cleared.")) {
                    chat.reset();
                  }
                },
                danger: true,
              },
            ]}
          />
        }
      />

      <div className="soc-wrap mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col px-4 pb-4">
        <div className="soc-card mt-[14px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-panel">
          <div className="soc-head flex items-center gap-3 border-b border-line px-4 py-[14px]">
            <Mascot
              mood={chat.isBusy ? "think" : "idle"}
              className="h-12 w-[52px]"
            />
            <div>
              <h2 className="text-[17px] font-extrabold">{agent.label}</h2>
              <p className="text-[13px] text-muted">
                Beep never gives the answer away — you get there first.
              </p>
            </div>
          </div>
          <ChatPanel
            messages={chat.messages}
            streamingText={chat.streamingText}
            onSend={chat.send}
            actions={agent.actions}
            onAction={(action) => chat.send(action.message, action.label)}
            placeholder="What are you wondering about?"
          />
        </div>
      </div>
    </section>
  );
}
