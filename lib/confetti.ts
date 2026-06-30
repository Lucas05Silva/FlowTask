/** Fire a subtle confetti burst (lazy-loads canvas-confetti, client-only). */
export async function fireConfetti(originX = 0.5, originY = 0.7): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 40,
    spread: 65,
    startVelocity: 32,
    gravity: 0.9,
    ticks: 130,
    scalar: 0.85,
    origin: { x: originX, y: originY },
    colors: ["#ad88ed", "#a0dde4", "#312199", "#c9b3f5", "#5bbcc9"],
  });
}

/** Bigger celebratory burst for level-ups. */
export async function fireBigConfetti(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#ad88ed", "#a0dde4", "#312199", "#c9b3f5"];
  confetti({ particleCount: 90, spread: 100, origin: { y: 0.55 }, colors, scalar: 1 });
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 70, origin: { x: 0 }, colors }), 150);
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 70, origin: { x: 1 }, colors }), 250);
}
