"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/navigation";
import { Menu, X, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useCasino } from "@/components/casino/casino-provider";
import { ReelReveal } from "@/components/casino/reel-reveal";
import { useResumeLoading } from "@/components/casino/resume-loading-provider";
import { useActiveSection } from "@/hooks/use-active-section";

// Section ids present on the homepage, in document order — used to drive
// the scroll-spy underline on the nav links that point to "/#<id>".
const SECTION_IDS = ["about", "skills", "projects", "experience", "contact"];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("Nav");
  const tCasino = useTranslations("Casino");
  const { triggerPlay, playKey, muted, toggleMute, playLever } = useCasino();
  const { trigger: triggerResumeLoading } = useResumeLoading();
  const pathname = usePathname();
  const activeSectionId = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLinkActive = (href: string) => {
    // Non-hash routes (e.g. "/blog") are active based on the current path.
    if (!href.includes("#")) {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    // Hash routes are only active while on the homepage, driven by scroll-spy.
    if (!/^\/(en|ja)\/?$/.test(pathname)) return false;
    const id = href.split("#")[1];
    return id === activeSectionId;
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[72rem] mx-auto px-6 md:px-8 min-h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link
          href="/"
          className="font-display font-bold text-lg md:text-2xl tracking-normal md:tracking-wide leading-tight
                     justify-self-start shrink-0 whitespace-nowrap
                     bg-gradient-to-r from-[var(--color-gold-dark)] via-[var(--color-gold)] to-[var(--color-gold-light)]
                     bg-clip-text text-transparent transition-all hover:brightness-125"
        >
          {SITE.name}
        </Link>

        <nav className="hidden md:flex items-center justify-self-center gap-4 xl:gap-6">
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "text-sm transition-colors relative group whitespace-nowrap",
                  active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(link.label)}
                <span
                  className={cn(
                    "absolute -bottom-0.5 left-0 h-px bg-indigo-600 transition-all duration-200",
                    active ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center justify-self-end gap-4">
          <span className="w-px h-4 bg-border" aria-hidden="true" />
          <LanguageSwitcher />
          <div
            className="play-btn-pulse flex items-center rounded-lg border border-indigo-200
                       bg-indigo-50 text-sm font-bold text-indigo-700 overflow-hidden"
          >
            <button
              onClick={() => {
                triggerPlay();
                playLever();
              }}
              className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-indigo-100
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label={tCasino("play")}
            >
              <span aria-hidden="true">♠</span>
              {tCasino("play")}
            </button>
            <span className="w-px h-4 bg-indigo-200" aria-hidden="true" />
            <button
              onClick={toggleMute}
              className="flex items-center justify-center px-2 py-1.5 transition-colors hover:bg-indigo-100
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label={muted ? tCasino("unmute") : tCasino("mute")}
              aria-pressed={muted}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
          <a
            href={SITE.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={triggerResumeLoading}
            className="resume-btn-premium whitespace-nowrap flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm
                       font-bold text-white transition-colors hover:bg-indigo-700
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
          >
            <span aria-hidden="true" className="text-[var(--color-gold-light)]">♦</span>
            <ReelReveal text={t("resume")} speed="fast" playKey={playKey} once={false} />
          </a>
        </div>

        <button
          className="md:hidden justify-self-end p-2 -mr-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-border overflow-hidden"
          >
            <nav className="px-6 py-4 flex flex-col gap-4">
              <LanguageSwitcher />
              <div
                className="play-btn-pulse flex items-center self-start rounded-lg border border-indigo-200
                           bg-indigo-50 text-sm font-bold text-indigo-700 overflow-hidden"
              >
                <button
                  onClick={() => {
                    triggerPlay();
                    playLever();
                  }}
                  className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-indigo-100
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  aria-label={tCasino("play")}
                >
                  <span aria-hidden="true">♠</span>
                  {tCasino("play")}
                </button>
                <span className="w-px h-4 bg-indigo-200" aria-hidden="true" />
                <button
                  onClick={toggleMute}
                  className="flex items-center justify-center px-2 py-1.5 transition-colors hover:bg-indigo-100
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  aria-label={muted ? tCasino("unmute") : tCasino("mute")}
                  aria-pressed={muted}
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
              <div className="h-px bg-border" aria-hidden="true" />
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {t(link.label)}
                </Link>
              ))}
              <a
                href={SITE.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={triggerResumeLoading}
                className="resume-btn-premium whitespace-nowrap flex items-center gap-1.5 self-start rounded-lg bg-indigo-600 px-3 py-1.5
                           text-sm font-bold text-white transition-colors hover:bg-indigo-700
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
              >
                <span aria-hidden="true" className="text-[var(--color-gold-light)]">♦</span>
                <ReelReveal text={t("resume")} speed="fast" playKey={playKey} once={false} />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
