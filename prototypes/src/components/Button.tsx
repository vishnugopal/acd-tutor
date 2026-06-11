import type { ComponentProps } from "react";

/** Codeyoung-amber primary action button (chunky 3D press effect). */
export function PrimaryButton({
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={`btn-primary cursor-pointer rounded-[14px] bg-cy-amber p-[15px] text-base font-extrabold tracking-[0.01em] text-ink shadow-[0_4px_0_var(--color-cy-amber-dark),0_8px_18px_rgba(255,182,0,0.35)] transition-all duration-100 hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-cy-amber-dark),0_4px_10px_rgba(255,182,0,0.35)] ${className}`}
      {...props}
    />
  );
}
