"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { scrambleText, REEL_SPEED, type ReelSpeed } from "@/lib/reel-utils";
import { useCasino } from "@/components/casino/casino-provider";

interface ReelRevealProps {
  /** The real text to reveal */
  text: string;
  /** HTML tag to render. Default: "span" */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  style?: React.CSSProperties;
  /** Animation speed preset. Default: "medium" */
  speed?: ReelSpeed;
  /**
   * Bumping this number re-triggers the animation.
   * Pass `playKey` from `useCasino()` to every ReelReveal
   * so the header PLAY button can re-spin everything.
   */
  playKey?: number;
  /**
   * true  → animates only on first viewport entry, then locks in and stops
   *         reacting to scroll (good for hero, above-fold)
   * false → keeps spinning with scroll for as long as it's in view (default)
   */
  once?: boolean;
}

// Below this scroll intensity, a reel is considered "at rest" and settles
// toward the real text rather than scrambling. Keeps a slow/idle scroll
// from constantly re-shuffling already-settled text. Raised from an
// earlier, much lower value that let almost any incidental scroll
// (including a slow, deliberate read-scroll) register as "spinning" —
// text should only actively churn on a clearly intentional, faster scroll.
const IDLE_THRESHOLD = 0.15;

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789♠♣♥♦";

export function ReelReveal({
  text,
  as: Tag = "span",
  className,
  style,
  speed = "medium",
  playKey = 0,
  once = false,
}: ReelRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(text); // real text on SSR
  const { playReelTick, getScrollIntensity, registerReelActive, unregisterReelActive } =
    useCasino();
  // Tracks the playKey value this instance last reacted to, so a change in
  // playKey can force a fresh full-scramble pass even while already in view.
  const lastPlayKeyRef = useRef(playKey);
  // Once a `once=true` element has fully settled, it locks in and stops
  // reacting to scroll — only a PLAY trigger re-spins it after that.
  const lockedRef = useRef(false);

  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { margin: "-60px" });

  // How settled each character currently is, 0 (fully scrambled) → 1
  // (settled on the real character). Persists across frames in a ref so the
  // per-frame loop can read/mutate it without triggering re-renders itself.
  const settleRef = useRef<number[]>([]);
  // Whether this instance is currently registered as "active" with the
  // casino provider (see registerReelActive/unregisterReelActive).
  const activeRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      const id = setTimeout(() => setDisplayText(text), 0);
      return () => clearTimeout(id);
    }

    const chars = text.split("");
    settleRef.current = chars.map(() => (lockedRef.current ? 1 : 0));

    const setActive = (active: boolean) => {
      if (active === activeRef.current) return;
      activeRef.current = active;
      if (active) registerReelActive();
      else unregisterReelActive();
    };

    const render = () => {
      setDisplayText(
        chars
          .map((char, i) =>
            char === " " || settleRef.current[i] >= 1
              ? char
              : CHARSET[Math.floor(Math.random() * CHARSET.length)]
          )
          .join("")
      );
    };

    const playKeyChanged = playKey !== lastPlayKeyRef.current;
    lastPlayKeyRef.current = playKey;

    if (playKeyChanged) {
      // A fresh PLAY trigger always re-spins from scratch, regardless of
      // lock state or current scroll — this is the one deliberate,
      // scroll-independent "full spin" gesture.
      lockedRef.current = false;
      settleRef.current = chars.map(() => 0);
      render();
    } else if (lockedRef.current || (once && !isInView)) {
      // Already locked in (once-settled `once` element), or an off-screen
      // `once` element that hasn't triggered yet — just show final/real
      // text without animating.
      setDisplayText(lockedRef.current ? text : scrambleText(text));
      return;
    } else if (!isInView) {
      // Off-screen, non-`once`: sit scrambled and wait to scroll back in.
      setDisplayText(scrambleText(text));
      return;
    }

    const { interval, settleChance } = REEL_SPEED[speed];
    let rafId: number;
    let intervalCarry = 0; // ms accumulated between frames, drives the tick cadence
    let lastFrameTime = performance.now();

    const loop = () => {
      const now = performance.now();
      const dt = now - lastFrameTime;
      lastFrameTime = now;

      const intensity = getScrollIntensity();
      const spinning = intensity > IDLE_THRESHOLD;

      setActive(spinning);

      if (spinning) {
        // Scramble-in churn while text is revealing on scroll-into-view —
        // the "slot reel" moment. Characters now settle (left-to-right,
        // same bias as the idle branch below) *while* spinning too, just
        // with a flashier, faster churn on the way there — instead of the
        // previous design where any character not yet settled would churn
        // in scrambled limbo for as long as scroll intensity stayed above
        // threshold, only resolving once the user paused/slowed down. On a
        // long continuous scroll (e.g. scrolling straight through several
        // cards), that meant text could stay unreadable-scrambled for the
        // entire scroll gesture — which is what actually read as
        // "aggressive," far more than the churn speed itself.
        intervalCarry += dt;
        const effectiveInterval = interval * (1 - intensity * 0.45);
        let flipped = false;
        while (intervalCarry >= effectiveInterval) {
          intervalCarry -= effectiveInterval;
          for (let i = 0; i < settleRef.current.length; i++) {
            if (chars[i] === " " || settleRef.current[i] >= 1) continue;
            flipped = true;
            const positionBonus = (1 - i / chars.length) * 0.15;
            if (Math.random() < settleChance + positionBonus) {
              settleRef.current[i] = 1;
            }
          }
        }
        // Tick fires in the same branch, on the same `flipped` condition,
        // as the visual render — so the sound is perfectly synced to every
        // moment the text actually changes on screen, not on an independent
        // timer that could drift out of phase with what's visible.
        if (flipped) {
          render();
          playReelTick(intensity);
        }

        // Everything settled while still "spinning" (a fast scroll can
        // outrun the settle chances above) — lock in and stop the loop
        // immediately rather than waiting for intensity to first decay
        // below IDLE_THRESHOLD, same end state the idle branch reaches.
        const stillUnsettled = settleRef.current.some(
          (v, i) => chars[i] !== " " && v < 1
        );
        if (!stillUnsettled) {
          setDisplayText(text);
          if (once) lockedRef.current = true;
          setActive(false);
          return;
        }
      } else {
        // At rest (or slowing down): settle left-to-right toward the real
        // text, paced by the unaccelerated `interval` from the speed preset
        // — same cadence/feel as the original interval-based settle.
        intervalCarry += dt;
        let allSettled = true;
        for (let i = 0; i < settleRef.current.length; i++) {
          if (chars[i] !== " " && settleRef.current[i] < 1) allSettled = false;
        }

        if (allSettled) {
          setDisplayText(text);
          if (once) lockedRef.current = true;
          setActive(false);
          return; // stop the loop — fully at rest
        }

        while (intervalCarry >= interval) {
          intervalCarry -= interval;
          let settledThisTick = false;
          for (let i = 0; i < settleRef.current.length; i++) {
            if (chars[i] === " " || settleRef.current[i] >= 1) continue;
            const positionBonus = (1 - i / chars.length) * 0.15;
            if (Math.random() < settleChance + positionBonus) {
              settleRef.current[i] = 1;
              settledThisTick = true;
            }
          }
          // Same rule as the spinning branch: tick exactly when the text
          // actually changes, so the sound stays perfectly synced to
          // visible motion all the way through the final settle, not just
          // during the aggressive spin phase.
          if (settledThisTick) playReelTick(intensity);
        }
        render();
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      setActive(false);
    };
  }, [
    isInView,
    playKey,
    text,
    speed,
    prefersReducedMotion,
    once,
    playReelTick,
    getScrollIntensity,
    registerReelActive,
    unregisterReelActive,
  ]);

  return (
    // @ts-expect-error — dynamic tag with forwarded ref
    <Tag ref={ref} className={className} style={style} aria-label={text}>
      <span aria-hidden="true">{displayText}</span>
    </Tag>
  );
}
