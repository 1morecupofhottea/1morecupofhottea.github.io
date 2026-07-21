import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getAllProjects } from "@/lib/content";
import { ProjectFilter } from "@/components/project/project-filter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProjectsPage" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const projects = getAllProjects(locale);
  const categories = Array.from(new Set(projects.map((p) => p.category)));

  const t = await getTranslations("ProjectsPage");

  return (
    <div className="pt-24 px-6 md:px-8 pb-24">
      <div className="max-w-[72rem] mx-auto">
        <div className="mb-12">
          <p className="text-sm font-medium tracking-widest text-indigo-600 uppercase mb-3">
            {t("label")}
          </p>
          <h1 className="font-bold tracking-tight mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            {t("description")}
          </p>
        </div>

        <ProjectFilter projects={projects} categories={categories} />
      </div>
    </div>
  );
}
