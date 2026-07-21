"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReelReveal } from "@/components/casino/reel-reveal";
import { useCasino } from "@/components/casino/casino-provider";

interface SlotBadgeProps {
  name: string;
}

export function SlotBadge({ name }: SlotBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const { playKey } = useCasino();

  return (
    <motion.span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                 bg-indigo-50 text-indigo-700 border border-indigo-100
                 hover:bg-indigo-100 transition-colors"
      whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {prefersReducedMotion ? (
        name
      ) : (
        <ReelReveal text={name} speed="fast" playKey={playKey} once={false} />
      )}
    </motion.span>
  );
}
