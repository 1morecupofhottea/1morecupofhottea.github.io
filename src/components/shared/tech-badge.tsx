"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TechBadgeProps {
  name: string;
  className?: string;
}

export function TechBadge({ name, className }: TechBadgeProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
        "bg-indigo-50 text-indigo-700 border border-indigo-100",
        "transition-colors hover:bg-indigo-100 cursor-default",
        className
      )}
    >
      {name}
    </motion.span>
  );
}
