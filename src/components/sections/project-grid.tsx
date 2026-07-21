"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ProjectCard } from "@/components/project/project-card";
import type { ProjectFrontmatter } from "@/lib/content";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// "Dealt from the shoe" entry: cards slide in from off-screen right with a
// slight spin, then settle with a spring bounce — mimics a card being dealt
// across a casino table. Falls back to a plain opacity+y fade under
// prefers-reduced-motion (see cardVariantReduced below).
const cardVariant = {
  hidden: { opacity: 0, x: 200, rotateZ: 15, scale: 0.9 },
  show: {
    opacity: 1,
    x: 0,
    rotateZ: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    },
  },
};

const cardVariantReduced = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

interface ProjectGridProps {
  projects: ProjectFrontmatter[];
}

/** Client-side stagger reveal for the featured project cards. Data fetching (fs-based) stays in the server-rendered parent. */
export function ProjectGrid({ projects }: ProjectGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const variant = prefersReducedMotion ? cardVariantReduced : cardVariant;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={container}
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {projects.map((project) => (
        <motion.div
          key={project.slug}
          variants={variant}
          transition={prefersReducedMotion ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] } : undefined}
          className="h-full"
        >
          <ProjectCard project={project} />
        </motion.div>
      ))}
    </motion.div>
  );
}
