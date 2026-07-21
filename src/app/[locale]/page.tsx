import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { AboutSection } from "@/components/sections/about-section";
import { SkillsSection } from "@/components/sections/skills-section";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { ExperienceTimeline } from "@/components/sections/experience-timeline";
import { ContactSection } from "@/components/sections/contact-section";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <AboutSection />
      <SkillsSection />
      <FeaturedProjects />
      <ExperienceTimeline />
      <ContactSection />
    </>
  );
}
