"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const SESSION_KEY = "initial-loading-shown";
const DISPLAY_MS = 2500;

/**
 * First-visit splash: shows the same "bouncing suit symbols" loading state
 * used for route transitions (see app/loading.tsx), but gated to play once
 * per browser session on initial entry to the site — right before the
 * CasinoIntro reel animation takes over.
 */
export function InitialLoading() {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    sessionStorage.setItem(SESSION_KEY, "1");

    const showTimer = setTimeout(() => setVisible(true), 0);
    const hideTimer = setTimeout(() => setVisible(false), DISPLAY_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [prefersReducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        >
          <LoadingIndicator />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
