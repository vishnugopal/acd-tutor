import { useState, type ReactNode } from "react";

const SHEET_MOBILE =
  "fixed inset-x-0 bottom-0 z-[80] mx-auto flex h-[min(62dvh,480px)] max-w-[1100px] flex-col rounded-t-[18px] border border-b-0 border-line bg-white shadow-[0_-10px_40px_rgba(61,48,6,0.16)] transition-transform duration-300 ease-[cubic-bezier(.5,1.2,.4,1)]";

// h-auto + min-h-0: the dock stretches to the (viewport-bounded) row height
// and stays fixed there — the transcript scrolls inside, never the dock.
const SHEET_DESKTOP =
  "min-[900px]:static min-[900px]:mt-[10px] min-[900px]:mr-4 min-[900px]:mb-4 min-[900px]:h-auto min-[900px]:min-h-0 min-[900px]:w-[360px] min-[900px]:max-w-none min-[900px]:flex-none min-[900px]:translate-y-0 min-[900px]:rounded-[18px] min-[900px]:border-b min-[900px]:shadow-panel";

/**
 * Container for the lesson chat: a slide-up bottom sheet on mobile (tap the
 * grabber to toggle) and a docked side panel on desktop (≥900px).
 * `unread` lights the grabber dot when a tutor message arrives while closed.
 */
export function ChatSheet({
  label,
  unread,
  onOpen,
  children,
}: {
  label: string;
  unread: boolean;
  onOpen?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen((v) => !v);
    if (!open) onOpen?.();
  }

  return (
    <div
      className={`chat-sheet ${open ? "open translate-y-0" : "translate-y-[calc(100%-52px)]"} ${SHEET_MOBILE} ${SHEET_DESKTOP}`}
    >
      <button
        className="grabber flex w-full cursor-pointer items-center justify-center gap-[10px] px-4 pt-2 pb-[6px] min-[900px]:cursor-default"
        type="button"
        onClick={toggle}
      >
        <span className="h-[4.5px] w-10 rounded-full bg-line min-[900px]:hidden" />
        <span className="flex items-center gap-[6px] text-[13.5px] font-bold text-cy-amber-dark">
          💬 {label}
          {unread && !open && (
            <span className="gdot size-2 rounded-full bg-cy-orange animate-[nodepulse_1.4s_infinite] min-[900px]:hidden" />
          )}
        </span>
      </button>
      {children}
    </div>
  );
}
