import { getLocale } from "next-intl/server";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { ProjectGrid } from "@/components/sections/project-grid";
import { getFeaturedProjects } from "@/lib/content";

export async function FeaturedProjects() {
  const locale = await getLocale();
  const projects = getFeaturedProjects(locale);

  return (
    <SectionWrapper id="projects" className="bg-muted/30">
      <ProjectGrid projects={projects} />
    </SectionWrapper>
  );
}
