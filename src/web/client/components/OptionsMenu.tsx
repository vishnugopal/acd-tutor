import { useEffect, useRef, useState } from "react";

export interface MenuItem {
  label: string;
  onSelect: () => void;
  /** Destructive styling (e.g. Start from scratch). */
  danger?: boolean;
}

/** "⋯" overflow menu for secondary actions; closes on outside click. */
export function OptionsMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        className="grid size-[34px] cursor-pointer place-items-center rounded-[10px] border border-line bg-white text-[17px] font-bold text-ink hover:border-cy-amber"
        aria-label="Options"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div className="absolute top-full right-0 z-[200] mt-2 min-w-[200px] overflow-hidden rounded-xl border border-line bg-white py-1 shadow-[0_12px_30px_rgba(29,26,16,0.18)] animate-[fadeup_.15s_ease_both]">
          {items.map((item) => (
            <button
              key={item.label}
              className={`block w-full cursor-pointer px-4 py-[10px] text-left text-[14px] font-semibold hover:bg-cream ${
                item.danger ? "text-cy-orange" : "text-ink"
              }`}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
