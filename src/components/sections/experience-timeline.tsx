"use client";

import { useRef, useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { SectionLabel } from "@/components/shared/section-label";
import { getExperienceItems } from "@/lib/constants";
import { ReelReveal } from "@/components/casino/reel-reveal";
import { useCasino } from "@/components/casino/casino-provider";
import { seededSuitScatter } from "@/lib/suit-scatter";
import { cn } from "@/lib/utils";

const SUITS = ["♠", "♣", "♥", "♦"] as const;

/** Deterministic suit per timeline entry, seeded by role+company (no category field here, unlike projects). */
function suitForEntry(seed: string) {
  let hash = 0;
  for (const c of seed) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
  return SUITS[Math.abs(hash) % SUITS.length];
}

interface TimelineCardProps {
  item: {
    date: string;
    role: string;
    company: string;
    description: string;
    tags: string[];
  };
  playKey: number;
}

function TimelineCard({ item, playKey }: TimelineCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const { playReelTick } = useCasino();

  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const hasHovered = useRef(false);

  const seed = `${item.role}-${item.company}`;
  const scatter = useMemo(() => seededSuitScatter(seed, 3), [seed]);
  const suit = useMemo(() => suitForEntry(seed), [seed]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasHovered.current && !prefersReducedMotion) {
      hasHovered.current = true;
      playReelTick(0.15);
    }

    if (!cardRef.current || prefersReducedMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotateX(-y * 10); // slightly gentler max tilt than project cards
    setRotateY(x * 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const tiltMag = prefersReducedMotion
    ? 0
    : Math.min(Math.abs(rotateX) + Math.abs(rotateY), 10) / 10;
  const glowIntensity = tiltMag * 0.6;

  const cardStyle = prefersReducedMotion
    ? undefined
    : {
        transformStyle: "preserve-3d" as const,
        boxShadow: `0 ${4 + tiltMag * 8}px ${15 + tiltMag * 15}px -5px rgba(79,70,229,${glowIntensity * 0.15}),
              0 0 ${glowIntensity * 20}px ${glowIntensity * 8}px rgba(79,70,229,${glowIntensity * 0.08})`,
      };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1200px",
        ...cardStyle,
      }}
      animate={prefersReducedMotion ? undefined : { rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ y: -4 }}
      className={cn(
        "card-shine group relative overflow-hidden rounded-xl border border-border bg-white/70 backdrop-blur-sm p-6 transition-shadow duration-200",
        prefersReducedMotion && "shadow-sm hover:shadow-md"
      )}
    >
      {/* Suit corner markers, like a real card's index */}
      <span
        aria-hidden="true"
        className="absolute top-2 left-2 text-[8px] opacity-0 group-hover:opacity-30 transition-opacity font-mono text-indigo-400 z-20"
      >
        {suit}
      </span>
      <span
        aria-hidden="true"
        className="absolute bottom-2 right-2 text-[8px] opacity-0 group-hover:opacity-30 transition-opacity font-mono text-indigo-400 rotate-180 z-20"
      >
        {suit}
      </span>

      {/* Mouse-follow shine */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            transform: "translateZ(30px)",
            background: `radial-gradient(circle at ${(rotateY / 10 + 0.5) * 100}% ${(rotateX / 10 + 0.5) * 100}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Background suit scatter watermark */}
      {scatter.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute select-none font-bold text-indigo-900 pointer-events-none"
          style={{
            left: s.x,
            top: s.y,
            fontSize: `${s.size}rem`,
            opacity: s.opacity,
            transform: prefersReducedMotion ? undefined : `translateZ(${s.z}px)`,
          }}
        >
          {s.suit}
        </span>
      ))}

      <div className="relative" style={prefersReducedMotion ? undefined : { transform: "translateZ(8px)" }}>
        <ReelReveal
          text={item.date}
          speed="fast"
          playKey={playKey}
          once={false}
          className="text-xs font-medium text-indigo-600 mb-1 block"
          style={prefersReducedMotion ? undefined : { transform: "translateZ(12px)" }}
        />
        <ReelReveal
          text={item.role}
          speed="medium"
          playKey={playKey}
          once={false}
          as="h3"
          className="font-semibold text-base block"
          style={prefersReducedMotion ? undefined : { transform: "translateZ(20px)" }}
        />
        <ReelReveal
          text={item.company}
          speed="fast"
          playKey={playKey}
          once={false}
          className="text-sm text-muted-foreground mb-3 block"
          style={prefersReducedMotion ? undefined : { transform: "translateZ(15px)" }}
        />
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.description}</p>
        <div
          className="flex flex-wrap gap-1.5"
          style={prefersReducedMotion ? undefined : { transform: "translateZ(15px)" }}
        >
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              <ReelReveal text={tag} speed="fast" playKey={playKey} once={false} />
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ExperienceTimeline() {
  const t = useTranslations("ExperienceSection");
  const locale = useLocale();
  const items = getExperienceItems(locale);
  const { playKey } = useCasino();

  return (
    <SectionWrapper id="experience">
      <SectionLabel number="04" total="05" title={t("title")} />
      <ReelReveal
        text={t("heading")}
        as="h2"
        speed="medium"
        playKey={playKey}
        className="font-semibold mb-12 block"
        style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
      />
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border md:left-1/2 md:-ml-px" />
        <div className="space-y-10">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative pl-8 md:w-[calc(50%-2rem)] md:pl-0 md:odd:pr-10 md:even:pl-10 md:even:ml-auto"
            >
              <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm md:left-auto md:odd:right-[-1.85rem] md:even:left-[-1.85rem]" />
              <TimelineCard item={item} playKey={playKey} />
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
