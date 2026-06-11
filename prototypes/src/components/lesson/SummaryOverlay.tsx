import { PrimaryButton } from "../Button";
import type { LessonSummary } from "../../types";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="srow flex justify-between border-b border-cy-amber-soft px-1 py-[9px] text-[15px] text-muted">
      <span>{label}</span>
      <b className="font-extrabold text-ink">{value}</b>
    </div>
  );
}

/** "Lesson complete" modal shown after a perfect check. */
export function SummaryOverlay({
  fileName,
  summary,
  onContinue,
}: {
  fileName: string;
  summary: LessonSummary;
  onContinue: () => void;
}) {
  return (
    <div className="overlay fixed inset-0 z-[1400] grid place-items-center bg-[rgba(47,39,8,0.45)] p-5 backdrop-blur-[4px]">
      <div className="w-full max-w-[360px] rounded-[22px] bg-white px-6 py-7 text-center shadow-[0_24px_60px_rgba(47,39,8,0.35)] animate-[popin_.45s_cubic-bezier(.4,1.6,.4,1)_both]">
        <div className="mx-auto mb-3 grid size-[60px] place-items-center rounded-full bg-cy-amber-soft text-[30px] text-cy-amber-dark">
          ✓
        </div>
        <h2 className="text-[22px] font-extrabold tracking-[-0.01em]">
          Lesson complete!
        </h2>
        <p className="mt-1 mb-[18px] text-sm text-muted">
          {fileName} · all lines classified
        </p>
        <StatRow label="XP earned" value={`+${summary.xpEarned}`} />
        <StatRow label="Accuracy" value={`${summary.accuracy}%`} />
        <StatRow label="Streak" value={`🔥 ${summary.streak} days`} />
        <PrimaryButton className="mt-[18px] w-full" onClick={onContinue}>
          Continue →
        </PrimaryButton>
      </div>
    </div>
  );
}
