const SUITS = ["♠", "♣", "♥", "♦"] as const;

export interface ScatteredSuit {
  suit: string;
  x: string;
  y: string;
  z: number;
  size: number;
  opacity: number;
}

/**
 * Deterministic "random" scatter of casino suit symbols, seeded by a
 * project's slug. Same slug always produces the same layout (stable across
 * server/client render and re-renders), but different slugs produce
 * visually distinct arrangements.
 */
export function seededSuitScatter(slug: string, count = 4): ScatteredSuit[] {
  let hash = 0;
  for (const c of slug) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;

  return Array.from({ length: count }, (_, i) => {
    const v = Math.abs((hash * (i + 1)) % 100) / 100;
    return {
      suit: SUITS[Math.floor(v * SUITS.length) % SUITS.length],
      x: `${(v * 397) % 100}%`,
      y: `${(v * 7919) % 100}%`,
      z: 6 + Math.floor(v * 10), // 6–15px
      size: 1.5 + v * 2.5, // 1.5rem–4rem
      opacity: 0.04 + v * 0.06, // 4%–10%
    };
  });
}
