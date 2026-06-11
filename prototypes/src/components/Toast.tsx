/**
 * Bottom-center toast. Content is trusted prototype copy (may include <b>),
 * hence dangerouslySetInnerHTML — revisit when content becomes dynamic.
 */
export function Toast({ message }: { message: string | null }) {
  return (
    <div
      className={`toast pointer-events-none fixed bottom-[84px] left-1/2 z-[1200] -translate-x-1/2 rounded-xl bg-ink px-5 py-3 text-[14.5px] font-bold text-[#fff8dd] shadow-[0_12px_30px_rgba(29,26,16,0.35)] transition-all duration-[350ms] ease-[cubic-bezier(.5,1.4,.4,1)] [&_b]:text-cy-yellow ${
        message ? "translate-y-0 opacity-100" : "translate-y-[30px] opacity-0"
      }`}
      role="status"
      dangerouslySetInnerHTML={{ __html: message ?? "" }}
    />
  );
}
