"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useReducedMotion,
  animate,
} from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

type CursorState = "default" | "hover" | "hover-gold";

const SUITS = ["♠", "♣", "♥", "♦"] as const;

const RING_SIZE: Record<CursorState, number> = {
  default: 32,
  hover: 52,
  "hover-gold": 56,
};

/** Chip face + ridge colors per state — gold state reads as a premium/high-value chip. */
const CHIP_STYLE: Record<
  CursorState,
  { border: string; background: string; ridge: string }
> = {
  default: {
    border: "1.5px dashed rgba(11, 12, 14, 0.25)",
    background: "rgba(255, 255, 255, 0.4)",
    ridge: "rgba(11, 12, 14, 0.12)",
  },
  hover: {
    border: "1.5px dashed #4f46e5",
    background: "rgba(79, 70, 229, 0.1)",
    ridge: "rgba(79, 70, 229, 0.3)",
  },
  "hover-gold": {
    border: "1.5px dashed #d4af37",
    background: "rgba(212, 175, 55, 0.14)",
    ridge: "rgba(212, 175, 55, 0.45)",
  },
};

const DOT_COLOR: Record<CursorState, string> = {
  default: "#0b0c0e",
  hover: "#4f46e5",
  "hover-gold": "#d4af37",
};

/**
 * Solid, fully-opaque click-flash color per state. Unlike the subtle default
 * chip styling (dashed border, low-opacity fills), this needs to read at a
 * glance, so even the "default" click uses the site's indigo accent rather
 * than a muted neutral.
 */
const FLASH_COLOR: Record<CursorState, string> = {
  default: "#4f46e5",
  hover: "#4f46e5",
  "hover-gold": "#d4af37",
};

const GOLD_SELECTOR = ".resume-btn-premium";
const INTERACTIVE_SELECTOR = 'button, a, [role="button"], label, input, select, textarea';

/**
 * Roulette-wheel color sequence the chip border cycles through while
 * spinning on click — casino palette (indigo → gold → near-black felt
 * green isn't in the palette, so we use foreground) then back to indigo,
 * like a wheel flashing past colored pockets before it settles.
 */
const SPIN_COLORS = ["#4f46e5", "#d4af37", "#0b0c0e", "#4f46e5"];

/** Deterministic suit per mount, seeded by a per-session counter so it stays stable while hovering. */
function pickSuit(seed: number) {
  return SUITS[seed % SUITS.length];
}

/**
 * Custom cursor styled as a poker chip on felt: a dashed "ridge" ring that
 * spring-lags the pointer (chip settling into place), with a center dot that
 * snaps instantly for precision. On interactive hover, a suit glyph fades in
 * at the chip's center — like a chip face flipping to show its mark. On
 * every click: the chip squeezes down, briefly flashes a solid color, spins
 * a full turn (roulette-wheel style) while its ridge color cycles through
 * the casino palette (indigo → gold → near-black → back), and a matching
 * solid-color "impact ring" (with its own suit glyph) expands outward from
 * the click point and fades. Only mounts on pointer-fine devices
 * (mouse/trackpad); skips spring/flash/spin/ripple animation entirely when
 * the user prefers reduced motion.
 */
export function CustomCursor() {
  // useMediaQuery uses useSyncExternalStore internally, whose distinct
  // server snapshot (`false`) matches the server-rendered `null` output of
  // this component exactly, avoiding a hydration mismatch. The real value
  // is only observed on the client, after mount.
  const isFinePointer = useMediaQuery("(pointer: fine)");
  const [cursorState, setCursorState] = useState<CursorState>("default");
  const cursorStateRef = useRef<CursorState>("default");
  const [suitSeed, setSuitSeed] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number; suit: string; color: string }[]
  >([]);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const springConfig = { stiffness: 250, damping: 20, mass: 0.3 };
  const ringX = useSpring(x, springConfig);
  const ringY = useSpring(y, springConfig);

  // Roulette spin — rotation accumulates by a full turn (+ a little extra
  // for variety) on every click, and the border color cycles through the
  // casino palette while it spins, like a wheel flashing past pockets
  // before settling back on the chip's normal state color.
  const rotate = useMotionValue(0);
  const spinColor = useMotionValue(CHIP_STYLE.default.ridge);
  const rotationRef = useRef(0);

  // Keep the ridge color in sync with the current hover state whenever it
  // changes outside of an active click-spin (e.g. moving from one button to
  // another without clicking) — the click handler's animate() call takes
  // over and settles on the same value once a spin is triggered.
  useEffect(() => {
    if (prefersReducedMotion) {
      spinColor.set(CHIP_STYLE[cursorState].ridge);
      return;
    }
    animate(spinColor, CHIP_STYLE[cursorState].ridge, { duration: 0.2 });
  }, [cursorState, prefersReducedMotion, spinColor]);

  useEffect(() => {
    if (!isFinePointer) return;

    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest) return;

      if (target.closest(GOLD_SELECTOR)) {
        setCursorState("hover-gold");
        cursorStateRef.current = "hover-gold";
        setSuitSeed((s) => s + 1);
      } else if (target.closest(INTERACTIVE_SELECTOR)) {
        setCursorState("hover");
        cursorStateRef.current = "hover";
        setSuitSeed((s) => s + 1);
      } else {
        setCursorState("default");
        cursorStateRef.current = "default";
      }
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    // Click flash + ripple + roulette spin — a solid-color "impact ring"
    // expands and fades from the click point, the chip briefly flashes a
    // solid color, and the chip ring itself spins a full turn while its
    // border color cycles through the casino palette (like a roulette wheel
    // flashing past pockets), settling back to the current state's color.
    // Ripple keyed by id so rapid clicks each get their own instance instead
    // of interrupting one another.
    let rippleId = 0;
    const handleClick = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const id = rippleId++;
      const state = cursorStateRef.current;
      const color = FLASH_COLOR[state];
      setRipples((prev) => [
        ...prev,
        { id, x: e.clientX, y: e.clientY, suit: pickSuit(id), color },
      ]);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 180);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 450);

      // Spin: rotate a full turn (+ a bit extra so consecutive clicks feel
      // distinct rather than snapping back to 0).
      rotationRef.current += 360 + Math.floor(Math.random() * 90);
      animate(rotate, rotationRef.current, {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      });
      // Color cycle: flash through the roulette sequence starting from
      // wherever the ridge color currently sits (avoids a color jump-cut at
      // the start of the spin), then settle on whatever color the current
      // hover state actually uses.
      animate(spinColor, [spinColor.get(), ...SPIN_COLORS, CHIP_STYLE[state].ridge], {
        duration: 0.6,
        ease: "linear",
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", handleClick);
    };
  }, [isFinePointer, x, y, prefersReducedMotion, rotate, spinColor]);

  // NOTE: no early return here — every hook above and below must run on
  // every render regardless of `isFinePointer`. `isFinePointer` starts
  // `false` (SSR-safe) and flips to its real value shortly after mount via
  // useSyncExternalStore; if any hook call were skipped on one of those
  // renders (e.g. by returning null before `useMotionTemplate` below),
  // React would see a different hook count between renders and throw
  // "Rendered more hooks than during the previous render." Whether to
  // render `null` is decided in the JSX below instead.
  const boxShadow = useMotionTemplate`inset 0 0 0 4px ${spinColor}`;

  const ringSize = RING_SIZE[cursorState];
  const chipStyle = CHIP_STYLE[cursorState];
  const isHovering = cursorState !== "default";
  const suit = pickSuit(suitSeed);

  if (!isFinePointer) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden="true">
      {/* Chip — dashed ridge ring, spring-lagged follower, spins + cycles ridge color on click */}
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          x: prefersReducedMotion ? x : ringX,
          y: prefersReducedMotion ? y : ringY,
          translateX: "-50%",
          translateY: "-50%",
          rotate,
          borderRadius: "50%",
          border: chipStyle.border,
          backgroundColor: chipStyle.background,
          boxShadow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        animate={{
          width: ringSize,
          height: ringSize,
          scale: isPressed ? 0.85 : 1,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 250, damping: 20, mass: 0.3 }
        }
      >
        {/* Suit face — fades in on hover, like a chip flipping to show its mark */}
        <motion.span
          className="font-serif select-none"
          style={{ color: DOT_COLOR[cursorState], fontSize: isHovering ? 18 : 0 }}
          animate={{ opacity: isHovering ? 0.85 : 0, scale: isHovering ? 1 : 0.5 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
        >
          {suit}
        </motion.span>
        {/* Click flash — brief solid color pulse over the chip face so the click reads clearly */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            backgroundColor: FLASH_COLOR[cursorState],
            pointerEvents: "none",
          }}
          animate={{ opacity: isFlashing ? 0.55 : 0 }}
          transition={{ duration: 0.12 }}
        />
      </motion.div>
      {/* Center dot — snaps to pointer instantly */}
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          x,
          y,
          translateX: "calc(-50% + 1px)",
          translateY: "-50%",
          borderRadius: "50%",
          backgroundColor: DOT_COLOR[cursorState],
        }}
        animate={{
          backgroundColor: DOT_COLOR[cursorState],
          opacity: isHovering ? 0 : 1,
          scale: isPressed ? 0.7 : 1,
        }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
      />
      {/* Click ripple — solid-color impact ring that expands + fades, one per click, colored to match the state that was clicked */}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          style={{
            position: "absolute",
            top: ripple.y,
            left: ripple.x,
            translateX: "-50%",
            translateY: "-50%",
            borderRadius: "50%",
            backgroundColor: ripple.color,
          }}
          initial={{ width: 10, height: 10, opacity: 0.7 }}
          animate={{ width: 70, height: 70, opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <span
            className="absolute inset-0 flex items-center justify-center font-serif text-white"
            style={{ fontSize: 14 }}
          >
            {ripple.suit}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
