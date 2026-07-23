/**
 * Pure scroll-intensity math used by `CasinoProvider` to drive how
 * aggressively `ReelReveal` instances scramble/settle on scroll, and how
 * loud/high-pitched the reel-tick sound is.
 *
 * Extracted out of the provider's scroll-handling `useEffect` so this math
 * — the actual "feel" tuning of the whole casino system — is unit-testable
 * without mounting a component or faking `window` scroll events.
 */

/** Scroll speed (px/ms) at/above which intensity maxes out at 1. Tuned by
 * feel: a fast trackpad/wheel fling lands around 3–5 px/ms. */
export const MAX_SCROLL_SPEED = 4;

/**
 * Touch-driven momentum scrolling reports far larger per-frame `scrollY`
 * deltas than a wheel/trackpad tick does for an equivalent, gentle swipe —
 * the same px/ms math that feels right for a "hard fling" on desktop was
 * being hit by nearly *every* ordinary mobile scroll gesture, pinning
 * intensity at (or near) 1 constantly. Dividing a touch session's measured
 * speed by this factor before comparing against `MAX_SCROLL_SPEED`
 * normalizes a normal swipe back down to a moderate intensity, while an
 * intentional fast fling can still reach 1.
 */
export const TOUCH_SCROLL_SPEED_DIVISOR = 3.5;

/** Multiplicative decay applied to intensity once per animation frame so it
 * reflects *recent* scroll speed rather than staying pinned at its peak. */
export const DECAY_FACTOR = 0.92;

/** Below this, decayed intensity snaps to exactly 0 instead of asymptoting
 * forever. */
export const DECAY_FLOOR = 0.001;

/**
 * Converts a raw scroll-delta measurement into a normalized speed in
 * px/ms, applying the touch-scroll normalization when `isCoarsePointer`.
 *
 * `dt` is clamped by the caller to at least 1ms before reaching here — this
 * function assumes `dt > 0`.
 */
export function computeScrollSpeed(
  deltaY: number,
  deltaTimeMs: number,
  isCoarsePointer: boolean
): number {
  const rawSpeed = Math.abs(deltaY) / deltaTimeMs;
  return isCoarsePointer ? rawSpeed / TOUCH_SCROLL_SPEED_DIVISOR : rawSpeed;
}

/**
 * Folds a newly-measured scroll `speed` (px/ms) into the current intensity.
 * Intensity only ever jumps *up* to a fresh speed reading (never down) —
 * decay is a separate, continuous process (see `decayIntensity`) so a burst
 * of fast scrolling immediately maxes out intensity, then fades back down
 * over subsequent frames rather than tracking speed instantaneously.
 */
export function applyScrollSpeed(currentIntensity: number, speed: number): number {
  const normalized = Math.min(speed / MAX_SCROLL_SPEED, 1);
  return Math.max(currentIntensity, normalized);
}

/**
 * One frame's worth of exponential decay toward 0, with a floor so the
 * value reaches exact 0 in finite time instead of approaching it forever.
 */
export function decayIntensity(currentIntensity: number): number {
  const next = currentIntensity * DECAY_FACTOR;
  return next < DECAY_FLOOR ? 0 : next;
}
