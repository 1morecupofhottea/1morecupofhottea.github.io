/** Characters used when a reel slot is scrambling */
export const CHARSET_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const CHARSET_NUM = "0123456789";
export const CHARSET_CASINO = "♠♣♥♦★☆◆◇";
export const CHARSET_FULL = CHARSET_ALPHA + CHARSET_NUM + CHARSET_CASINO;

export function randomChar(charset = CHARSET_FULL): string {
  return charset[Math.floor(Math.random() * charset.length)];
}

/**
 * Returns a scrambled version of `text`.
 * Spaces are always preserved — they never scramble.
 */
export function scrambleText(text: string): string {
  return text
    .split("")
    .map((char) => (char === " " ? " " : randomChar()))
    .join("");
}

/**
 * Speed presets — controls how fast characters settle left-to-right.
 *
 * fast   → ~350ms  total  (short labels, dates)
 * medium → ~550ms  total  (section headings)
 * slow   → ~800ms  total  (intro overlay)
 */
export const REEL_SPEED = {
  fast: { interval: 24, settleChance: 0.3 },
  medium: { interval: 34, settleChance: 0.22 },
  slow: { interval: 45, settleChance: 0.16 },
} as const;

export type ReelSpeed = keyof typeof REEL_SPEED;
