import { useEffect, useState } from "react";
import { fetchAgents } from "./api";
import { Mascot } from "./components/Mascot";
import { AGENT_UI } from "./data/agents";
import { ChatLessonScreen } from "./screens/ChatLessonScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { IdeLessonScreen } from "./screens/IdeLessonScreen";
import type { AgentInfo, Screen } from "./types";

export function App() {
  const [agents, setAgents] = useState<AgentInfo[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  const loadAgents = () => {
    setLoadError(false);
    fetchAgents()
      .then(setAgents)
      .catch(() => setLoadError(true));
  };
  useEffect(loadAgents, []);

  const goHome = () => setScreen({ name: "home" });
  const openLesson = (agent: AgentInfo) => setScreen({ name: "lesson", agent });

  let body;
  if (loadError) {
    body = (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <Mascot mood="think" className="h-[84px] w-[90px]" />
        <p className="text-[15px] font-semibold text-ink">
          Hmm, I couldn't wake up your tutors.
        </p>
        <button
          className="cursor-pointer rounded-xl bg-cy-amber px-5 py-3 text-sm font-extrabold text-ink active:scale-95"
          onClick={loadAgents}
        >
          Try again
        </button>
      </div>
    );
  } else if (agents === null) {
    body = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <Mascot mood="idle" className="h-[84px] w-[90px]" />
        <p className="text-[15px] font-semibold text-muted">Waking up Beep…</p>
      </div>
    );
  } else if (screen.name === "home") {
    body = <HomeScreen agents={agents} onSelect={openLesson} />;
  } else {
    // Agents with a workbook editor get the IDE layout; the rest chat-only.
    const editorKind = AGENT_UI[screen.agent.id]?.editor;
    body = editorKind ? (
      <IdeLessonScreen
        agent={screen.agent}
        editorKind={editorKind}
        onExit={goHome}
      />
    ) : (
      <ChatLessonScreen agent={screen.agent} onExit={goHome} />
    );
  }

  return (
    <div className="app mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col">
      {body}
    </div>
  );
}
