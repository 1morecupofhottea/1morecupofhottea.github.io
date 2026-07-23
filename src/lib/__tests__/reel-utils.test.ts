import { describe, it, expect } from "vitest";
import {
  CHARSET_ALPHA,
  CHARSET_NUM,
  CHARSET_CASINO,
  CHARSET_FULL,
  randomChar,
  scrambleText,
  REEL_SPEED,
} from "@/lib/reel-utils";

describe("CHARSET_FULL", () => {
  it("is the concatenation of alpha, num, and casino charsets", () => {
    expect(CHARSET_FULL).toBe(CHARSET_ALPHA + CHARSET_NUM + CHARSET_CASINO);
  });

  it("has no duplicate characters", () => {
    const chars = CHARSET_FULL.split("");
    expect(new Set(chars).size).toBe(chars.length);
  });
});

describe("randomChar", () => {
  it("always returns a single character from the default charset", () => {
    for (let i = 0; i < 200; i++) {
      const c = randomChar();
      expect(c).toHaveLength(1);
      expect(CHARSET_FULL).toContain(c);
    }
  });

  it("respects a custom charset argument", () => {
    const customCharset = "XY";
    for (let i = 0; i < 50; i++) {
      expect(["X", "Y"]).toContain(randomChar(customCharset));
    }
  });

  it("can return every character in a small charset given enough draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      seen.add(randomChar("AB"));
      if (seen.size === 2) break;
    }
    expect(seen).toEqual(new Set(["A", "B"]));
  });
});

describe("scrambleText", () => {
  it("preserves length", () => {
    expect(scrambleText("Hello World")).toHaveLength("Hello World".length);
  });

  it("always preserves spaces in their original positions", () => {
    const input = "Hello World Foo";
    const result = scrambleText(input);
    for (let i = 0; i < input.length; i++) {
      if (input[i] === " ") {
        expect(result[i]).toBe(" ");
      } else {
        expect(result[i]).not.toBe(" ");
      }
    }
  });

  it("only uses characters from CHARSET_FULL for non-space characters", () => {
    const result = scrambleText("Some Reveal Text");
    for (const char of result) {
      if (char !== " ") {
        expect(CHARSET_FULL).toContain(char);
      }
    }
  });

  it("returns an empty string for empty input", () => {
    expect(scrambleText("")).toBe("");
  });

  it("returns an all-space string unchanged", () => {
    expect(scrambleText("   ")).toBe("   ");
  });

  it("produces varying output across calls (not deterministic/identity)", () => {
    const input = "AAAAAAAAAAAAAAAAAAAA";
    const results = new Set(Array.from({ length: 20 }, () => scrambleText(input)));
    // Overwhelmingly unlikely all 20 scrambles of a 20-char string collide
    // if randomization is actually happening.
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("REEL_SPEED presets", () => {
  it("defines fast, medium, and slow presets", () => {
    expect(Object.keys(REEL_SPEED).sort()).toEqual(["fast", "medium", "slow"]);
  });

  it("orders interval ascending fast < medium < slow (fast settles quickest)", () => {
    expect(REEL_SPEED.fast.interval).toBeLessThan(REEL_SPEED.medium.interval);
    expect(REEL_SPEED.medium.interval).toBeLessThan(REEL_SPEED.slow.interval);
  });

  it("orders settleChance descending fast > medium > slow (fast settles most eagerly per tick)", () => {
    expect(REEL_SPEED.fast.settleChance).toBeGreaterThan(REEL_SPEED.medium.settleChance);
    expect(REEL_SPEED.medium.settleChance).toBeGreaterThan(REEL_SPEED.slow.settleChance);
  });

  it("has settleChance values within (0, 1]", () => {
    for (const preset of Object.values(REEL_SPEED)) {
      expect(preset.settleChance).toBeGreaterThan(0);
      expect(preset.settleChance).toBeLessThanOrEqual(1);
    }
  });

  it("has positive interval values", () => {
    for (const preset of Object.values(REEL_SPEED)) {
      expect(preset.interval).toBeGreaterThan(0);
    }
  });
});
