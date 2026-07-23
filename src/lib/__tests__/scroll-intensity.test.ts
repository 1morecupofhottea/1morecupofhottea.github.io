import { describe, it, expect } from "vitest";
import {
  MAX_SCROLL_SPEED,
  TOUCH_SCROLL_SPEED_DIVISOR,
  DECAY_FACTOR,
  DECAY_FLOOR,
  computeScrollSpeed,
  applyScrollSpeed,
  decayIntensity,
} from "@/lib/scroll-intensity";

describe("computeScrollSpeed", () => {
  it("computes px/ms speed for a pointer (non-touch) session", () => {
    // 40px over 10ms = 4 px/ms
    expect(computeScrollSpeed(40, 10, false)).toBeCloseTo(4);
  });

  it("takes the absolute value of the delta (direction-agnostic)", () => {
    expect(computeScrollSpeed(-40, 10, false)).toBeCloseTo(4);
  });

  it("divides by TOUCH_SCROLL_SPEED_DIVISOR for coarse/touch pointers", () => {
    const pointerSpeed = computeScrollSpeed(40, 10, false);
    const touchSpeed = computeScrollSpeed(40, 10, true);
    expect(touchSpeed).toBeCloseTo(pointerSpeed / TOUCH_SCROLL_SPEED_DIVISOR);
  });

  it("returns 0 for zero delta", () => {
    expect(computeScrollSpeed(0, 16, false)).toBe(0);
  });
});

describe("applyScrollSpeed", () => {
  it("normalizes speed against MAX_SCROLL_SPEED, capped at 1", () => {
    expect(applyScrollSpeed(0, MAX_SCROLL_SPEED)).toBeCloseTo(1);
    expect(applyScrollSpeed(0, MAX_SCROLL_SPEED * 10)).toBe(1);
  });

  it("scales linearly below the max", () => {
    expect(applyScrollSpeed(0, MAX_SCROLL_SPEED / 2)).toBeCloseTo(0.5);
  });

  it("never decreases intensity — only jumps up to a fresh, higher reading", () => {
    // Current intensity (0.8) is higher than this frame's normalized speed
    // (0.2) — a slow-down should NOT be reflected instantaneously here;
    // that's decay's job, not this function's.
    expect(applyScrollSpeed(0.8, MAX_SCROLL_SPEED * 0.2)).toBe(0.8);
  });

  it("jumps up when the new reading exceeds current intensity", () => {
    expect(applyScrollSpeed(0.1, MAX_SCROLL_SPEED)).toBeCloseTo(1);
  });

  it("returns 0 when both current intensity and speed are 0", () => {
    expect(applyScrollSpeed(0, 0)).toBe(0);
  });
});

describe("decayIntensity", () => {
  it("multiplies by DECAY_FACTOR", () => {
    expect(decayIntensity(1)).toBeCloseTo(DECAY_FACTOR);
  });

  it("monotonically decreases a positive value", () => {
    let value = 1;
    for (let i = 0; i < 10; i++) {
      const next = decayIntensity(value);
      expect(next).toBeLessThanOrEqual(value);
      value = next;
    }
  });

  it("snaps to exactly 0 once below DECAY_FLOOR", () => {
    // Choose a value guaranteed to fall below the floor after one decay.
    const tiny = DECAY_FLOOR / DECAY_FACTOR - 1e-6;
    expect(decayIntensity(tiny)).toBe(0);
  });

  it("stays 0 once at 0 (idempotent at rest)", () => {
    expect(decayIntensity(0)).toBe(0);
  });

  it("reaches exactly 0 in finite iterations from a full-intensity start", () => {
    let value = 1;
    let iterations = 0;
    const MAX_ITERATIONS = 1000;
    while (value > 0 && iterations < MAX_ITERATIONS) {
      value = decayIntensity(value);
      iterations++;
    }
    expect(value).toBe(0);
    expect(iterations).toBeLessThan(MAX_ITERATIONS);
  });
});
