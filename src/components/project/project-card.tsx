"use client";

import { useMemo, useRef, useState } from "react";
import { Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProjectFrontmatter } from "@/lib/content";
import { ReelReveal } from "@/components/casino/reel-reveal";
import { useCasino } from "@/components/casino/casino-provider";
import { seededSuitScatter } from "@/lib/suit-scatter";

interface ProjectCardProps {
  project: ProjectFrontmatter;
}

/** Project category → casino suit + gold-styled badge label. */
const SUIT_MAP: Record<string, { suit: string; label: string }> = {
  AI: { suit: "♠", label: "Spades" },
  Web: { suit: "♥", label: "Hearts" },
  Mobile: { suit: "♦", label: "Diamonds" },
  Backend: { suit: "♣", label: "Clubs" },
  DevOps: { suit: "★", label: "Star" },
  Design: { suit: "♦", label: "Diamonds" },
  ML: { suit: "♠", label: "Spades" },
  Data: { suit: "♣", label: "Clubs" },
};

const DEFAULT_SUIT = { suit: "♠", label: "Spades" };

export function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations("ProjectCard");
  const prefersReducedMotion = useReducedMotion();
  const { playKey, playReelTick } = useCasino();

  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const hasHovered = useRef(false);

  const scatter = useMemo(() => seededSuitScatter(project.slug, 4), [project.slug]);
  const suitInfo = SUIT_MAP[project.category] ?? DEFAULT_SUIT;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hasHovered.current && !prefersReducedMotion) {
      hasHovered.current = true;
      playReelTick(0.15);
    }

    if (!cardRef.current || prefersReducedMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setRotateX(-y * 12); // max ±12 degrees
    setRotateY(x * 12);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Tilt magnitude (0 → 1) drives the glow border intensity — a hard tilt
  // "heats up" the card, mirroring the scroll-intensity → sound paradigm
  // used elsewhere in the casino theme.
  const tiltMag = prefersReducedMotion
    ? 0
    : Math.min(Math.abs(rotateX) + Math.abs(rotateY), 12) / 12;
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
      style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
      animate={prefersReducedMotion ? undefined : { rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Card
        className={cn(
          "card-shine group relative overflow-hidden border-border bg-white/70 backdrop-blur-sm h-full flex flex-col p-0 transition-shadow duration-200",
          prefersReducedMotion &&
            "hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)]"
        )}
        style={cardStyle}
      >
        {/* Suit corner markers — invisible at rest, revealed on hover, like a real card's index */}
        <span
          aria-hidden="true"
          className="absolute top-2 left-2 text-[8px] opacity-0 group-hover:opacity-30 transition-opacity font-mono text-indigo-400 z-20"
        >
          {suitInfo.suit}
        </span>
        <span
          aria-hidden="true"
          className="absolute bottom-2 right-2 text-[8px] opacity-0 group-hover:opacity-30 transition-opacity font-mono text-indigo-400 rotate-180 z-20"
        >
          {suitInfo.suit}
        </span>

        {/* Shine overlay that follows mouse — skipped entirely under reduced motion */}
        {!prefersReducedMotion && (
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
            style={{
              transform: "translateZ(30px)",
              background: `radial-gradient(circle at ${(rotateY / 12 + 0.5) * 100}% ${(rotateX / 12 + 0.5) * 100}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
            }}
          />
        )}

        {/* Hero/image area — gradient + scattered suit symbols, parallaxing under tilt */}
        <div
          className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-sky-50 flex items-center justify-center"
          style={
            prefersReducedMotion
              ? undefined
              : {
                  transform: "translateZ(4px)",
                  backgroundPosition: `${50 + rotateY * 1.5}% ${50 + rotateX * 1.5}%`,
                }
          }
        >
          {scatter.map((s, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="absolute select-none font-bold text-indigo-900"
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
          <div className="relative text-4xl font-bold text-indigo-200 select-none">
            {project.title.slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div
          className="p-6 flex flex-col flex-1"
          style={prefersReducedMotion ? undefined : { transform: "translateZ(8px)" }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link href={`/projects/${project.slug}`}>
              <ReelReveal
                text={project.title}
                as="h3"
                speed="fast"
                playKey={playKey}
                once={false}
                className="font-semibold text-base leading-tight group-hover:text-indigo-600 transition-colors block"
                style={prefersReducedMotion ? undefined : { transform: "translateZ(20px)" }}
              />
            </Link>
            <Badge
              className="text-xs shrink-0 gap-1 border bg-gradient-to-r from-[var(--color-gold)]/10 to-[var(--color-gold)]/5 border-[var(--color-gold)]/30 text-[var(--color-gold-dark)]"
              style={prefersReducedMotion ? undefined : { transform: "translateZ(12px)" }}
            >
              <span aria-hidden="true">{suitInfo.suit}</span>
              {project.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                style={prefersReducedMotion ? undefined : { transform: "translateZ(15px)" }}
              >
                <ReelReveal text={tag} speed="fast" playKey={playKey} once={false} />
              </span>
            ))}
          </div>
          <div
            className="flex gap-3 mt-auto"
            style={prefersReducedMotion ? undefined : { transform: "translateZ(12px)" }}
          >
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <GithubIcon size={14} />
                {t("github")}
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink size={14} />
                {t("liveDemo")}
              </a>
            )}
            <Link
              href={`/projects/${project.slug}`}
              className="ml-auto text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              {t("readMore")}
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
