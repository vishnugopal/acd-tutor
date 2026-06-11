/**
 * Imperative, fire-and-forget visual effects (confetti bursts, floating XP
 * labels). These append throwaway nodes to <body> and clean up after their
 * animation — deliberately outside React, since nothing re-renders from them.
 */

const CONFETTI_COLORS = ["#ffb600", "#ffeb00", "#ff712d", "#2e5cff", "#2f9e63"];

export function burstConfetti(fromEl?: HTMLElement | null, count = 60): void {
  const rect = fromEl?.getBoundingClientRect() ?? {
    left: 0,
    top: window.innerHeight / 2,
    width: window.innerWidth,
  };

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "fx-confetti";
    piece.style.background =
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!;
    piece.style.left = `${rect.left + Math.random() * rect.width}px`;
    piece.style.top = `${rect.top + 4}px`;

    const duration = 900 + Math.random() * 900;
    const dx = (Math.random() * 2 - 1) * 160;
    const dy = -(120 + Math.random() * 240);
    const spin = Math.random() * 720 - 360;

    piece.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${dx}px,${dy}px) rotate(${spin / 2}deg)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(${dx * 1.4}px,${dy + 380}px) rotate(${spin}deg)`,
          opacity: 0,
        },
      ],
      { duration, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" },
    );

    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), duration + 100);
  }
}

export function floatLabel(text: string, anchor?: HTMLElement | null): void {
  const el = document.createElement("div");
  el.className = "fx-floater";
  el.textContent = text;
  const rect = anchor?.getBoundingClientRect();
  el.style.left = `${(rect ? rect.left + rect.width / 2 : window.innerWidth / 2) - 28}px`;
  el.style.top = `${(rect ? rect.top : window.innerHeight / 2) - 6}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}
