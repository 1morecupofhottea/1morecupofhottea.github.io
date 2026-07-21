"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Link } from "@/lib/navigation";
import { ArrowDown } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { ReelReveal } from "@/components/casino/reel-reveal";
import { useCasino } from "@/components/casino/casino-provider";
import { useResumeLoading } from "@/components/casino/resume-loading-provider";
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/** Wraps children in a div that gently follows the cursor on hover (magnetic effect). */
function MagneticButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || prefersReducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const t = useTranslations("Hero");
  const site = useTranslations("Site");
  const prefersReducedMotion = useReducedMotion();
  const { playKey } = useCasino();
  const { trigger: triggerResumeLoading } = useResumeLoading();

  const { scrollY } = useScroll();
  const orb1Y = useTransform(scrollY, [0, 500], [0, -80]);
  const orb2Y = useTransform(scrollY, [0, 500], [0, -120]);
  const orb3Y = useTransform(scrollY, [0, 500], [0, -60]);
  const orb1X = useTransform(scrollY, [0, 500], [0, 30]);
  const orb3X = useTransform(scrollY, [0, 500], [0, -40]);
  const heroOpacity = useTransform(
    scrollY,
    [0, 300],
    prefersReducedMotion ? [1, 1] : [1, 0]
  );

  const title = site("title");

  return (
    <section className="relative min-h-screen flex items-center px-6 md:px-8 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,70,229,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Floating gradient orbs with scroll parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <motion.div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, var(--color-indigo) 0%, transparent 70%)",
            filter: "blur(80px)",
            y: orb1Y,
            x: orb1X,
          }}
          animate={
            prefersReducedMotion
              ? undefined
              : { scale: [1, 1.15, 1], rotate: [0, 5, 0] }
          }
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-24 w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
            filter: "blur(80px)",
            y: orb2Y,
          }}
          animate={
            prefersReducedMotion
              ? undefined
              : { scale: [1, 1.2, 1], rotate: [0, -8, 0] }
          }
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #818cf8 0%, transparent 70%)",
            filter: "blur(80px)",
            y: orb3Y,
            x: orb3X,
          }}
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        style={{ opacity: heroOpacity }}
        className="max-w-[72rem] mx-auto w-full pt-24 pb-16"
      >
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl">
          <motion.p
            variants={item}
            className="text-sm font-medium tracking-widest text-indigo-600 uppercase mb-6"
          >
            {t("greeting", { name: SITE.name })}
          </motion.p>

          <motion.h1
            variants={item}
            className="font-bold leading-[1.1] tracking-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
          >
            <ReelReveal text={title} speed="medium" once={false} playKey={playKey} />
            <br />
            <span className="text-muted-foreground">{site("tagline")}</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-4 mb-16">
            <MagneticButton>
              <Link href="/#projects" className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 hover:bg-indigo-700 text-white")}>
                {t("viewProjects")}
              </Link>
            </MagneticButton>
            <MagneticButton>
              <a href={SITE.resumeUrl} target="_blank" rel="noopener noreferrer" onClick={triggerResumeLoading} className={cn(buttonVariants({ size: "lg" }), "resume-btn-premium bg-indigo-600 hover:bg-indigo-700 text-white gap-2 focus-visible:ring-[var(--color-gold)]")}>
                <span aria-hidden="true" className="text-[var(--color-gold-light)]">♦</span>
                <ReelReveal text={t("downloadResume")} speed="fast" playKey={playKey} once={false} />
              </a>
            </MagneticButton>
            <a
              href={SITE.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-11 w-11 rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="GitHub"
            >
              <GithubIcon size={18} />
            </a>
            <a
              href={SITE.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-11 w-11 rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedinIcon size={18} />
            </a>
          </motion.div>


        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={prefersReducedMotion ? undefined : { y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ArrowDown size={20} className="text-muted-foreground" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
