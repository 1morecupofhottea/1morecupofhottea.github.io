"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { SectionLabel } from "@/components/shared/section-label";
import { SlotBadge } from "@/components/casino/slot-badge";
import { ReelReveal } from "@/components/casino/reel-reveal";
import { useCasino } from "@/components/casino/casino-provider";
import { getSkillGroups } from "@/lib/constants";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const badgeVariant = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
};

export function SkillsSection() {
  const t = useTranslations("SkillsSection");
  const locale = useLocale();
  const skillGroups = getSkillGroups(locale);
  const { playKey } = useCasino();

  return (
    <SectionWrapper id="skills">
      <SectionLabel number="02" total="05" title={t("title")} />
      <ReelReveal
        text={t("heading")}
        as="h2"
        speed="medium"
        playKey={playKey}
        className="font-semibold mb-12 block"
        style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {skillGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {group.title}
            </h3>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="flex flex-wrap gap-2"
            >
              {group.skills.map((skill) => (
                <motion.div key={skill} variants={badgeVariant}>
                  <SlotBadge name={skill} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
