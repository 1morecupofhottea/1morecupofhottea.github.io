import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { GithubIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CraftPage" });
  return {
    title: t("title"),
    description: t("intro"),
  };
}

export default async function CraftPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("CraftPage");

  const sections = [
    { title: t("reelTitle"), body: t("reelBody") },
    { title: t("soundTitle"), body: t("soundBody") },
    { title: t("cursorTitle"), body: t("cursorBody") },
    { title: t("i18nTitle"), body: t("i18nBody") },
    { title: t("contentTitle"), body: t("contentBody") },
    { title: t("qualityTitle"), body: t("qualityBody") },
  ];

  return (
    <div className="pt-24 px-6 md:px-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm font-medium tracking-widest text-indigo-600 uppercase mb-3">
          {t("label")}
        </p>
        <h1
          className="font-bold tracking-tight mb-6"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
        >
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-14 pb-8 border-b border-border">
          {t("intro")}
        </p>

        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-semibold text-xl mb-3">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-muted-foreground leading-relaxed">{t("closing")}</p>
          <a
            href={SITE.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2 shrink-0")}
          >
            <GithubIcon size={16} />
            {t("viewSource")}
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
