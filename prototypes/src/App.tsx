import { useState } from "react";
import { GameStateProvider } from "./state/GameStateContext";
import { HomeScreen } from "./screens/HomeScreen";
import { AcdLessonScreen } from "./screens/AcdLessonScreen";
import { SocraticScreen } from "./screens/SocraticScreen";
import type { Screen } from "./types";
// note: global.css is linked from index.html so bun-plugin-tailwind processes it

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const goHome = () => setScreen("home");

  return (
    <GameStateProvider>
      <div className="app mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col">
        {screen === "home" && <HomeScreen onNavigate={setScreen} />}
        {screen === "acd" && <AcdLessonScreen onExit={goHome} />}
        {screen === "socratic" && <SocraticScreen onExit={goHome} />}
      </div>
    </GameStateProvider>
  );
}
