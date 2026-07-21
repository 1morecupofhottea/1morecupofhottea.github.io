import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE, getSkillGroups, getExperienceItems } from "@/lib/constants";
import { ResumeButton } from "@/components/casino/resume-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  const site = await getTranslations({ locale, namespace: "Site" });
  return {
    title: t("label"),
    description: `Learn more about ${SITE.name} — ${site("title")} specializing in Khmer speech recognition and low-resource ASR.`,
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AboutPage");
  const skillGroups = getSkillGroups(locale);
  const experienceItems = getExperienceItems(locale);

  return (
    <div className="pt-24 px-6 md:px-8 pb-24">
      <div className="max-w-[72rem] mx-auto">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <p className="text-sm font-medium tracking-widest text-indigo-600 uppercase mb-3">
              {t("label")}
            </p>
            <h1 className="font-bold tracking-tight mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              {SITE.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {SITE.bio}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t("focusParagraph")}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              {t("prepParagraph")}
            </p>

            <div className="flex flex-wrap gap-3">
              <ResumeButton className={cn(buttonVariants(), "resume-btn-premium bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 focus-visible:ring-[var(--color-gold)]")}>
                <span aria-hidden="true" className="text-[var(--color-gold-light)]">♦</span>
                {t("downloadResume")}
              </ResumeButton>
              <a href={`mailto:${SITE.email}`} className={buttonVariants({ variant: "outline" })}>
                <Mail size={14} className="mr-2" />
                {t("getInTouch")}
              </a>
            </div>
          </div>

          <div className="space-y-8">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl font-bold text-indigo-300">
              {SITE.name.charAt(0)}
            </div>

            <div>
              <h3 className="font-semibold mb-4">{t("connect")}</h3>
              <div className="space-y-3">
                {[
                  { icon: GithubIcon, href: SITE.socials.github, key: "github" },
                  { icon: LinkedinIcon, href: SITE.socials.linkedin, key: "linkedin" },
                  { icon: Mail, href: `mailto:${SITE.email}`, key: null, label: SITE.email },
                ].map(({ icon: Icon, href, key, label }) => (
                  <a
                    key={label ?? key}
                    href={href}
                    target={href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon size={16} className="text-indigo-600 shrink-0" />
                    {key ? t(key) : label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="font-semibold text-2xl mb-8">{t("technologies")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {skillGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.skills.map((s) => (
                    <li key={s} className="text-sm text-foreground">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <h2 className="font-semibold text-2xl mb-8">{t("experience")}</h2>
          <div className="space-y-8">
            {experienceItems.map((item, i) => (
              <div key={i} className="flex gap-6 pb-8 border-b border-border last:border-0">
                <div className="w-24 shrink-0 text-xs text-muted-foreground pt-1">{item.date}</div>
                <div>
                  <h3 className="font-semibold">{item.role}</h3>
                  <p className="text-sm text-indigo-600 mb-2">{item.company}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
