/**
 * Tab bar of the student's lesson files (the tutor creates a new file per
 * lesson). The active tab gets the raised "open file" look.
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
  return (
    <>
      {files.map((name) => {
        const isActive = name === active;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            className={`ftab flex cursor-pointer items-center gap-2 rounded-t-[10px] border border-b-0 px-4 py-[9px] font-mono text-[12.5px] ${
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
    </>
  );
}
