import { getLocale, getTranslations } from "next-intl/server";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export async function Footer({ locale }: { locale?: string }) {
  const t = await getTranslations("Footer");
  const resolvedLocale = locale ?? await getLocale();
  const isJa = resolvedLocale === "ja";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-8 px-6 md:px-8">
      <div
        className={cn(
          "max-w-[72rem] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4",
          isJa && "sm:flex-col text-center gap-2"
        )}
      >
        <p className={cn("text-sm text-muted-foreground", isJa && "text-xs")}>
          © {year} {SITE.name} — {t("builtWith")}
          {isJa && <> — 無断転載を禁じます。</>}
        </p>
        <div className="flex items-center gap-4">
          <a
            href={SITE.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <GithubIcon size={18} />
          </a>
          <a
            href={SITE.socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="LinkedIn"
          >
            <LinkedinIcon size={18} />
          </a>

        </div>
        {isJa && (
          <a
            href="#"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ↑ ページトップへ
          </a>
        )}
      </div>
    </footer>
  );
}
