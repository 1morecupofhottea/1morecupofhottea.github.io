"use client";

import { ReelReveal } from "@/components/casino/reel-reveal";
import { useCasino } from "@/components/casino/casino-provider";

interface SectionLabelProps {
  number: string;
  total: string;
  title: string;
}

export function SectionLabel({ number, total, title }: SectionLabelProps) {
  const { playKey } = useCasino();

  return (
    <p className="section-label text-sm font-medium tracking-widest text-muted-foreground uppercase mb-4">
      <span className="text-[var(--color-indigo)]">{number}</span>
      <span className="mx-1 opacity-40">/</span>
      <span className="opacity-40">{total}</span>
      <span className="mx-3 opacity-40">—</span>
      <ReelReveal text={title} speed="fast" playKey={playKey} once={false} />
    </p>
  );
}
