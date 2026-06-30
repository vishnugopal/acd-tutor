import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Tab bar of the student's lesson files (the tutor creates a new file per
 * lesson). The active tab gets the raised "open file" look. Tabs keep their
 * full size and the strip scrolls like a browser tab bar: ‹ › buttons appear
 * at the edges once there are more tabs than fit.
 */
export function FileTabs({
  files,
  active,
  onSelect,
}: {
  files: string[];
  active: string | null;
  onSelect: (name: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setEdges({
      left: scrollLeft > 1,
      right: Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1,
    });
  }, []);

  // Re-measure on file changes and whenever the strip is resized.
  useLayoutEffect(() => {
    measure();
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, files]);

  // Keep the active tab in view when it changes (e.g. the tutor opens a new one).
  useEffect(() => {
    if (active == null) return;
    const el = scroller.current;
    const tab = el?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(active)}"]`);
    tab?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [active]);

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    // pr clears the peeking mascot anchored to the right of the tab bar.
    <div className="ftabs flex min-w-0 flex-1 items-end gap-1 pr-[64px]">
      <ScrollButton dir="left" show={edges.left} onClick={() => scroll(-1)} />
      <div
        ref={scroller}
        onScroll={measure}
        className="no-scrollbar flex min-w-0 flex-1 items-end gap-1 overflow-x-auto"
      >
        {files.map((name) => {
          const isActive = name === active;
          return (
            <button
              key={name}
              type="button"
              data-tab={name}
              onClick={() => onSelect(name)}
              className={`ftab flex shrink-0 cursor-pointer items-center gap-2 rounded-t-[10px] border border-b-0 px-4 py-[9px] font-mono text-[12.5px] whitespace-nowrap ${
                isActive
                  ? "border-line bg-white text-ink"
                  : "border-transparent bg-transparent text-muted hover:text-ink"
              }`}
            >
              <span
                className={`dot size-2 rounded-full ${isActive ? "bg-cy-amber" : "bg-line"}`}
              />{" "}
              {name}
            </button>
          );
        })}
      </div>
      <ScrollButton dir="right" show={edges.right} onClick={() => scroll(1)} />
    </div>
  );
}

/** ‹ / › edge control — kept mounted (just hidden) so the strip width is stable. */
function ScrollButton({
  dir,
  show,
  onClick,
}: {
  dir: "left" | "right";
  show: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Scroll tabs left" : "Scroll tabs right"}
      tabIndex={show ? 0 : -1}
      onClick={onClick}
      className={`mb-[3px] flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-white font-mono text-[13px] text-muted transition hover:text-ink ${
        show ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {dir === "left" ? "‹" : "›"}
    </button>
  );
}
