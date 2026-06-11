import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { INITIAL_COMPLETED_LESSONS } from "../data/course";

/**
 * Session-wide gamification state (XP, streak, hearts, lesson progress).
 * All dummy/client-side for the prototype; later this maps onto server state.
 */

const INITIAL = {
  xp: 140,
  xpGoal: 200,
  streak: 7,
  maxHearts: 3,
  hearts: 3,
};

export interface GameState {
  xp: number;
  xpGoal: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  completedLessons: number[];
  addXp: (amount: number) => void;
  loseHeart: () => void;
  bumpStreak: () => void;
  completeLesson: (lessonNumber: number) => void;
}

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [xp, setXp] = useState(INITIAL.xp);
  const [streak, setStreak] = useState(INITIAL.streak);
  const [hearts, setHearts] = useState(INITIAL.hearts);
  const [completedLessons, setCompletedLessons] = useState<number[]>(
    INITIAL_COMPLETED_LESSONS,
  );

  const addXp = useCallback((amount: number) => setXp((v) => v + amount), []);
  const loseHeart = useCallback(
    () => setHearts((v) => Math.max(0, v - 1)),
    [],
  );
  const bumpStreak = useCallback(() => setStreak((v) => v + 1), []);
  const completeLesson = useCallback(
    (lessonNumber: number) =>
      setCompletedLessons((prev) =>
        prev.includes(lessonNumber) ? prev : [...prev, lessonNumber],
      ),
    [],
  );

  const value = useMemo<GameState>(
    () => ({
      xp,
      xpGoal: INITIAL.xpGoal,
      streak,
      hearts,
      maxHearts: INITIAL.maxHearts,
      completedLessons,
      addXp,
      loseHeart,
      bumpStreak,
      completeLesson,
    }),
    [xp, streak, hearts, completedLessons, addXp, loseHeart, bumpStreak, completeLesson],
  );

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameState {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState must be used inside GameStateProvider");
  return ctx;
}
