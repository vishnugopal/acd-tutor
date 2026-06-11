import type { MascotMood } from "../types";

/**
 * Beep — the tutor mascot, in Codeyoung colors (amber body, cream belly,
 * orange beak/details). Mood animations (bob/cheer/tilt + blink) live in
 * global.css as a small CSS rig keyed off the `mascot`/mood classes, since
 * they animate SVG internals. Size/position come from the caller's className.
 */
export function Mascot({
  mood = "idle",
  className = "",
}: {
  mood?: MascotMood;
  className?: string;
}) {
  return (
    <div className={`mascot ${mood} ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 90 84">
        <g className="grp">
          {/* tail feather */}
          <path d="M18 48 Q6 44 8 34 Q16 38 20 42 Z" fill="#e0a300" />
          {/* body */}
          <ellipse cx="45" cy="46" rx="27" ry="25" fill="#ffb600" />
          <ellipse cx="45" cy="52" rx="18" ry="15" fill="#fff1c7" />
          {/* wing */}
          <path d="M64 44 Q76 48 72 58 Q64 56 60 50 Z" fill="#e0a300" />
          {/* head tuft */}
          <path
            d="M40 22 Q42 12 48 16 M46 21 Q50 11 55 17"
            stroke="#e0a300"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {/* eyes */}
          <g className="blink">
            <circle cx="36" cy="40" r="6.5" fill="#fff" />
            <circle cx="54" cy="40" r="6.5" fill="#fff" />
            <circle cx="37.5" cy="41" r="3" fill="#1d1a10" />
            <circle cx="55.5" cy="41" r="3" fill="#1d1a10" />
            <circle cx="38.6" cy="39.8" r="1" fill="#fff" />
            <circle cx="56.6" cy="39.8" r="1" fill="#fff" />
          </g>
          {/* beak */}
          <path d="M42 48 L48 48 L45 54 Z" fill="#ff712d" />
          {/* cheeks */}
          <circle cx="29" cy="48" r="3.4" fill="#ff9d92" opacity=".7" />
          <circle cx="61" cy="48" r="3.4" fill="#ff9d92" opacity=".7" />
          {/* feet */}
          <path
            d="M38 70 L38 78 M34 78 L42 78 M52 70 L52 78 M48 78 L56 78"
            stroke="#ff712d"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
