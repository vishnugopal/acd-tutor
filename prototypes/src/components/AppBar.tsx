import type { ReactNode } from "react";
import { useGameState } from "../state/GameStateContext";

const CHIP =
  "flex items-center gap-[5px] rounded-full border border-line bg-white px-[11px] py-[5px] text-[13.5px] font-bold";

function Hearts() {
  const { hearts, maxHearts } = useGameState();
  return (
    <span
      className={`hearts ${CHIP} tracking-[1px] text-cy-orange`}
      aria-label={`${hearts} of ${maxHearts} hearts`}
    >
      {Array.from({ length: maxHearts }, (_, i) => (
        <span key={i} className={i < hearts ? "" : "off text-[#ead9c6]"}>
          ♥
        </span>
      ))}
    </span>
  );
}

/**
 * Sticky top bar: brand slot, XP "build" progress, streak, hearts.
 * Pass `onBack` to show a back button (lesson screens).
 */
export function AppBar({
  brand,
  onBack,
  showHearts = true,
}: {
  brand: ReactNode;
  onBack?: () => void;
  showHearts?: boolean;
}) {
  const { xp, xpGoal, streak } = useGameState();
  const pct = xp >= xpGoal ? 100 : Math.round((xp / xpGoal) * 100);

  return (
    <div className="appbar sticky top-0 z-[60] flex items-center gap-3 border-b border-line bg-[rgba(255,247,224,0.92)] px-[18px] py-3 backdrop-blur-[8px]">
      {onBack && (
        <button
          className="back grid size-[34px] cursor-pointer place-items-center rounded-[10px] border border-line bg-white text-[17px] font-bold text-ink transition-transform duration-[120ms] hover:-translate-x-0.5"
          onClick={onBack}
          aria-label="Back to home"
        >
          ←
        </button>
      )}
      {brand}
      <div className="buildbar flex min-w-[60px] flex-1 items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full border border-line bg-cy-amber-soft">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cy-amber to-cy-yellow transition-[width] duration-700 ease-[cubic-bezier(.5,1.3,.4,1)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-[11px] whitespace-nowrap text-muted">
          <b className="text-cy-amber-dark">{xp}</b>/{xpGoal} xp
        </span>
      </div>
      <span className={`streak ${CHIP} text-cy-orange`}>🔥 {streak}</span>
      {showHearts && <Hearts />}
    </div>
  );
}
