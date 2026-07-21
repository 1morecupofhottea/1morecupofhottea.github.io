"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { scrambleText, REEL_SPEED } from "@/lib/reel-utils";
import { SITE } from "@/lib/constants";

const SESSION_KEY = "casino-intro-shown";

/** A single reel that fast-scrambles then settles on `target` after `delay` ms */
function IntroReel({ target, delay }: { target: string; delay: number }) {
  const [display, setDisplay] = useState(() => scrambleText(target));
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789♠♣♥♦";

    // Phase 1: fast random scramble until delay expires
    const fastInterval = setInterval(() => {
      setDisplay(scrambleText(target));
    }, 40);

    // Phase 2: switch to settling animation
    const settleTimer = setTimeout(() => {
      clearInterval(fastInterval);

      const chars = target.split("");
      const settled = new Array(chars.length).fill(false);
      const { interval, settleChance } = REEL_SPEED.slow;

      const tick = setInterval(() => {
        setDisplay(
          chars
            .map((char, i) => {
              if (char === " " || settled[i]) return char;
              const bonus = (1 - i / chars.length) * 0.2;
              if (Math.random() < settleChance + bonus) {
                settled[i] = true;
                return char;
              }
              return CHARSET[Math.floor(Math.random() * CHARSET.length)];
            })
            .join("")
        );
        if (chars.every((c, i) => settled[i] || c === " ")) {
          clearInterval(tick);
          setDisplay(target);
          setIsSettled(true);
        }
      }, interval);
    }, delay);

    return () => {
      clearInterval(fastInterval);
      clearTimeout(settleTimer);
    };
  }, [target, delay]);

  return (
    <div
      className={`font-mono text-center text-base sm:text-lg font-bold tracking-widest
                  transition-colors duration-300 ${
                    isSettled ? "text-indigo-600" : "text-muted-foreground"
                  }`}
    >
      {display}
    </div>
  );
}

export function CasinoIntro() {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    sessionStorage.setItem(SESSION_KEY, "1");

    // Deferred one tick so the state update happens inside a callback rather
    // than synchronously in the effect body (avoids react-hooks/set-state-in-effect).
    const showTimer = setTimeout(() => setVisible(true), 0);
    const hideTimer = setTimeout(() => setVisible(false), 2000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [prefersReducedMotion]);

  const reels = [
    { target: SITE.name, delay: 350 },
    { target: SITE.title, delay: 700 },
    { target: SITE.tagline.split("&")[0].trim(), delay: 1050 },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setVisible(false)}
          aria-hidden="true"
        >
          {/* Decorative card suits — 4% opacity so they're barely visible */}
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-serif text-7xl opacity-[0.04]">
            <span className="absolute left-8 top-8">♠</span>
            <span className="absolute right-8 top-8">♥</span>
            <span className="absolute bottom-8 left-8">♦</span>
            <span className="absolute bottom-8 right-8">♣</span>
          </div>

          <div className="flex flex-col items-center gap-6 px-4">
            {/* Small label above reels */}
            <p className="font-mono text-xs tracking-[0.4em] text-muted-foreground/60 uppercase">
              Portfolio
            </p>

            {/* 3 reel windows */}
            <div className="flex flex-col sm:flex-row gap-4">
              {reels.map(({ target, delay }) => (
                <div
                  key={target}
                  className="relative w-full sm:w-48 overflow-hidden rounded-xl
                             border-2 border-indigo-200 bg-indigo-50/60 px-4 py-5"
                  style={{ boxShadow: "inset 0 2px 10px rgba(79,70,229,0.07)" }}
                >
                  {/* Top/bottom gradient masks give the "reel window" illusion */}
                  <div className="pointer-events-none absolute left-0 right-0 top-0 h-5 bg-gradient-to-b from-indigo-50/80 to-transparent" />
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-indigo-50/80 to-transparent" />
                  <IntroReel target={target} delay={delay} />
                </div>
              ))}
            </div>

            {/* Gold separator line — appears after all reels settle */}
            <motion.div
              className="h-px w-64 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.4 }}
            />

            <p className="text-xs text-muted-foreground/50">
              Click anywhere to skip
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
