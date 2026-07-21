import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/lib/navigation";
import { notFound } from "next/navigation";
import { ExternalLink, ArrowLeft, Calendar } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { getProject, getAllProjects } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description,
  };
}

export function generateStaticParams() {
  const locales = ["en", "ja"];
  return locales.flatMap((locale) =>
    getAllProjects().map((p) => ({ locale, slug: p.slug }))
  );
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const project = getProject(slug, locale);
  if (!project) notFound();

  const all = getAllProjects(locale);
  const idx = all.findIndex((p) => p.slug === slug);
  const next = all[idx + 1] ?? null;

  const t = await getTranslations("ProjectDetail");

  return (
    <div className="pt-24 px-6 md:px-8 pb-24">
      <div className="max-w-[72rem] mx-auto">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          {t("backToProjects")}
        </Link>

        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="secondary">{project.category}</Badge>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar size={13} />
              {formatDate(project.publishedAt, locale)}
            </span>
          </div>

          <h1 className="font-bold tracking-tight mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            {project.title}
          </h1>

          <p className="text-lg text-muted-foreground mb-6">{project.description}</p>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-3 mb-12">
            {project.github && (
              <a href={project.github} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <GithubIcon size={14} className="mr-2" />
                {t("viewOnGitHub")}
              </a>
            )}
            {project.demo && (
              <a href={project.demo} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "sm" }), "bg-indigo-600 hover:bg-indigo-700 text-white")}>
                <ExternalLink size={14} className="mr-2" />
                {t("liveDemo")}
              </a>
            )}
          </div>
        </div>

        <div className="h-64 rounded-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-sky-50 mb-12 flex items-center justify-center">
          <p className="text-4xl font-bold text-indigo-200">{project.title.slice(0, 2).toUpperCase()}</p>
        </div>

        <div className="max-w-3xl">
          <article className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-indigo-600 prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-pre:bg-slate-900 prose-pre:text-slate-50">
            <div
              dangerouslySetInnerHTML={{
                __html: project.content
                  .replace(/^## /gm, '<h2 class="mt-8 mb-4">')
                  .replace(/\n/g, "<br />"),
              }}
            />
          </article>

          {next && (
            <div className="mt-16 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">{t("nextProject")}</p>
              <Link
                href={`/projects/${next.slug}`}
                className="font-semibold text-lg hover:text-indigo-600 transition-colors"
              >
                {next.title} →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
