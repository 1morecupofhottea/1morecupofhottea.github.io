import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { SectionWrapper } from "@/components/shared/section-wrapper";
import { SectionLabel } from "@/components/shared/section-label";
import { ProjectGrid } from "@/components/sections/project-grid";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFeaturedProjects } from "@/lib/content";

export async function FeaturedProjects() {
  const t = await getTranslations("ProjectsSection");
  const locale = await getLocale();
  const projects = getFeaturedProjects(locale);

  return (
    <SectionWrapper id="projects" className="bg-muted/30">
      <SectionLabel number="03" total="05" title={t("title")} />
      <div className="flex items-end justify-between mb-12">
        <h2 className="font-semibold" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
          {t("heading")}
        </h2>
        <Link href="/projects" className={cn(buttonVariants({ variant: "ghost" }), "text-indigo-600 hover:text-indigo-700 hidden sm:flex")}>
          {t("viewAll")}
        </Link>
      </div>
      <ProjectGrid projects={projects} />
      <div className="mt-8 sm:hidden">
        <Link href="/projects" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
          {t("viewAllMobile")}
        </Link>
      </div>
    </SectionWrapper>
  );
}
