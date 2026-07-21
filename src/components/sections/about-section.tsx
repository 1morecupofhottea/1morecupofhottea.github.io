"use client";

import { useTranslations } from "next-intl";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { SectionLabel } from "@/components/shared/section-label";
import { ReelReveal } from "@/components/casino/reel-reveal";
import { useCasino } from "@/components/casino/casino-provider";

export function AboutSection() {
  const t = useTranslations("AboutSection");
  const site = useTranslations("Site");
  const { playKey } = useCasino();

  return (
    <SectionWrapper id="about" className="bg-muted/30">
      <SectionLabel number="01" total="05" title={t("title")} />
      <div className="max-w-3xl">
        <div
          className="relative overflow-hidden mb-6"
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
        >
          <span aria-hidden="true" className="invisible font-semibold block">
            {t("heading")}
          </span>
          <ReelReveal
            text={t("heading")}
            as="h2"
            speed="medium"
            playKey={playKey}
            once
            className="absolute top-0 left-0 w-full font-semibold block"
          />
        </div>
        <p className="text-muted-foreground leading-relaxed mb-4">
          {site("bio")}
        </p>
        <p className="text-muted-foreground leading-relaxed">
          {t("bio2")}
        </p>
      </div>
    </SectionWrapper>
  );
}
