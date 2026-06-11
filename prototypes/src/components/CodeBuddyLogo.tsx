/**
 * Code Buddy logo: the Codeyoung-derived mark (bright-yellow angled shape
 * over an amber square with an orange inset — same brand colors) + wordmark.
 */
export function CodeBuddyLogo({ subtitle }: { subtitle?: string }) {
  return (
    <span className="brand flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.01em] whitespace-nowrap">
      <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="7" y="13" width="18" height="16" fill="#ffb600" />
        <rect x="16" y="13" width="9" height="7" fill="#ff712d" />
        <polygon points="11,2 23,4 17,17 5,15" fill="#ffeb00" />
      </svg>
      Code Buddy
      {subtitle ? (
        <span className="text-[13px] font-semibold text-muted">{subtitle}</span>
      ) : null}
    </span>
  );
}
