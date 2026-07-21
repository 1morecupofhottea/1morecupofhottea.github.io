"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ProjectCard } from "@/components/project/project-card";
import { cn } from "@/lib/utils";
import type { ProjectFrontmatter } from "@/lib/content";

// "Dealt from the shoe" entry, matching ProjectGrid — cards slide in from
// off-screen right with a slight spin and spring-bounce to rest. Here each
// card also carries its own per-index delay (via `custom`) since entries
// happen outside a single stagger-orchestrated mount pass (filter changes
// add/remove cards independently).
const cardVariant = {
  hidden: { opacity: 0, x: 200, rotateZ: 15, scale: 0.9 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    rotateZ: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    },
  }),
};

const cardVariantReduced = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface ProjectFilterProps {
  projects: ProjectFrontmatter[];
  categories: string[];
}

export function ProjectFilter({ projects, categories }: ProjectFilterProps) {
  const [active, setActive] = useState("All");
  const t = useTranslations("ProjectFilter");
  const prefersReducedMotion = useReducedMotion();

  const filtered = active === "All" ? projects : projects.filter((p) => p.category === active);
  const variant = prefersReducedMotion ? cardVariantReduced : cardVariant;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-12">
        <button
          onClick={() => setActive("All")}
          className={cn(
            "text-sm px-4 py-1.5 rounded-full border transition-colors",
            active === "All"
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "border-border hover:bg-muted"
          )}
        >
          {t("all")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={cn(
              "text-sm px-4 py-1.5 rounded-full border transition-colors",
              active === cat
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-border hover:bg-muted"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((project, i) => (
            <motion.div
              key={project.slug}
              layout={!prefersReducedMotion}
              custom={i}
              variants={variant}
              initial="hidden"
              animate="show"
              exit={
                prefersReducedMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, scale: 0.85, y: 20, transition: { duration: 0.25 } }
              }
              className="h-full"
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
