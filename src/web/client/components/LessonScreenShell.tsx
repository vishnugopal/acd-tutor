import type { ReactNode } from "react";
import { AppBar } from "./AppBar";
import { OptionsMenu } from "./OptionsMenu";

/**
 * The scaffolding both lesson screens share: AppBar with back navigation and
 * the overflow menu — the debug-mode toggle (web counterpart of the console's
 * /debug, no busy guard so it applies mid-stream) and "Start from scratch"
 * with its confirm dialog and busy guard. Screens supply only the layout
 * inside.
 */
export function LessonScreenShell({
  brand,
  onExit,
  showHearts = true,
  busy,
  confirmText,
  onStartFromScratch,
  debugMode,
  onToggleDebug,
  className,
  children,
}: {
  brand: ReactNode;
  onExit: () => void;
  showHearts?: boolean;
  /** Blocks the destructive reset while a reply is streaming. */
  busy: boolean;
  /** The window.confirm prompt for "Start from scratch". */
  confirmText: string;
  onStartFromScratch: () => void;
  debugMode: boolean;
  onToggleDebug: () => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      <AppBar
        brand={brand}
        onBack={onExit}
        showHearts={showHearts}
        menu={
          <OptionsMenu
            items={[
              {
                label: `🐞 Debug mode: ${debugMode ? "On" : "Off"}`,
                onSelect: onToggleDebug,
              },
              {
                label: "🌱 Start from scratch",
                danger: true,
                onSelect: () => {
                  if (busy) return;
                  if (window.confirm(confirmText)) onStartFromScratch();
                },
              },
            ]}
          />
        }
      />
      {children}
    </section>
  );
}
