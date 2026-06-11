import type { ReactNode } from "react";
import { STATIC_GAME } from "../data/gamification";

const CHIP =
  "flex items-center gap-[5px] rounded-full border border-line bg-white px-[11px] py-[5px] text-[13.5px] font-bold";

/**
 * Sticky top bar: brand slot, XP "build" progress, streak, hearts.
 * Gamification values are static placeholders for now (data/gamification.ts).
 */
export function AppBar({
  brand,
  onBack,
  showHearts = true,
  menu,
}: {
  brand: ReactNode;
  onBack?: () => void;
  showHearts?: boolean;
  /** Optional trailing slot, e.g. the "⋯" options menu. */
  menu?: ReactNode;
}) {
  const { xp, xpGoal, streak, hearts, maxHearts } = STATIC_GAME;
  const pct = xp >= xpGoal ? 100 : Math.round((xp / xpGoal) * 100);

  return (
    // z-[100]: above the chat sheet (z-[80]) so the options dropdown — which
    // lives inside this stacking context — can't be painted under it.
    <div className="appbar sticky top-0 z-[100] flex items-center gap-3 border-b border-line bg-[rgba(255,247,224,0.92)] px-[18px] py-3 backdrop-blur-[8px]">
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
            className="h-full rounded-full bg-gradient-to-r from-cy-amber to-cy-yellow"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-[11px] whitespace-nowrap text-muted">
          <b className="text-cy-amber-dark">{xp}</b>/{xpGoal} xp
        </span>
      </div>
      <span className={`streak ${CHIP} text-cy-orange`}>🔥 {streak}</span>
      {showHearts && (
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
      )}
      {menu}
    </div>
  );
}
