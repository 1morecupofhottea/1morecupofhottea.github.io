"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = ["en", "ja"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "en";

// This app doesn't use next-intl's `[locale]` App Router folder convention —
// `src/proxy.ts` rewrites locale-prefixed URLs to unprefixed routes server-side
// instead. Because of that, `next-intl`'s `createNavigation` pathname/router
// helpers (which assume the `[locale]` convention) can't correctly strip an
// existing prefix here, so we do it manually against the raw browser pathname
// and rebuild the target URL to match `localePrefix: "as-needed"` (default
// locale "en" stays unprefixed, "ja" is prefixed with `/ja`).
function stripLocalePrefix(pathname: string): string {
  for (const l of LOCALES) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(`/${l}`.length);
  }
  return pathname;
}

function buildLocalizedPath(pathname: string, nextLocale: Locale): string {
  const bare = stripLocalePrefix(pathname);
  if (nextLocale === DEFAULT_LOCALE) return bare;
  return bare === "/" ? `/${nextLocale}` : `/${nextLocale}${bare}`;
}

function setLocaleCookie(nextLocale: string) {
  document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Self-contained language switcher.
 * - Desktop: dropdown trigger (Globe + current label + chevron) with an
 *   animated menu listing both locales, checkmark on the active one.
 * - Mobile: always-visible radio-style row of both locales (no dropdown).
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const lang = useTranslations("LangSwitch");
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Brief spin on the Globe icon while a switch is in flight. Modeled as
  // "state derived from a changing prop" (see react.dev "Adjusting state
  // when a prop changes"): store the locale we last rendered with, and if
  // the current `locale` differs from a pending target we requested, we're
  // still navigating. This setState call happens during render, guarded by
  // a condition, which React explicitly supports for this exact case.
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const [prevLocale, setPrevLocale] = useState(locale);
  if (locale !== prevLocale) {
    setPrevLocale(locale);
    if (pendingLocale === locale) {
      setPendingLocale(null);
      setIsNavigating(false);
    }
  }

  const handleSwitch = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) {
        setIsOpen(false);
        return;
      }
      setIsOpen(false);
      setIsNavigating(true);
      setPendingLocale(nextLocale);
      setLocaleCookie(nextLocale);
      router.replace(buildLocalizedPath(pathname, nextLocale));
      // `router.replace` alone only performs a client-side soft navigation.
      // Because this app has no `[locale]` route segment, the root layout
      // (which reads the locale via `getLocale()`/proxy header) isn't part
      // of the segment key that changed, so Next.js's Router Cache can
      // reuse the previously rendered layout/messages instead of re-running
      // the server render. `router.refresh()` invalidates that cache for
      // the current route and forces the server components — including the
      // root layout — to re-run with the new locale, which is what actually
      // applies the switch without requiring a manual page reload.
      router.refresh();
    },
    [locale, pathname, router]
  );

  // When the dropdown opens, move focus to the active option (standard
  // listbox behavior) so keyboard users land directly on a selectable item.
  useEffect(() => {
    if (!isOpen) return;
    const activeIndex = LOCALES.indexOf(locale);
    optionRefs.current[activeIndex]?.focus();
  }, [isOpen, locale]);

  // Click outside closes the dropdown.
  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  // Escape closes the dropdown and returns focus to the trigger. Arrow
  // Up/Down move focus between options (wrapping). Tab/Shift+Tab are
  // trapped within the trigger + options while open, so focus can't
  // escape the widget until it's closed.
  useEffect(() => {
    if (!isOpen) return;

    const focusOption = (index: number) => {
      const wrapped = (index + LOCALES.length) % LOCALES.length;
      optionRefs.current[wrapped]?.focus();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const current = optionRefs.current.findIndex((el) => el === document.activeElement);
        focusOption(current === -1 ? 0 : current + 1);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const current = optionRefs.current.findIndex((el) => el === document.activeElement);
        focusOption(current === -1 ? LOCALES.length - 1 : current - 1);
        return;
      }

      if (e.key === "Tab") {
        // Focus trap: only the trigger and the two options are focusable
        // while the dropdown is open. Wrap Tab from the last option back
        // to the trigger, and Shift+Tab from the trigger to the last option.
        const focusables = [triggerRef.current, ...optionRefs.current].filter(
          (el): el is HTMLButtonElement => el !== null
        );
        const current = focusables.indexOf(document.activeElement as HTMLButtonElement);
        if (current === -1) return;

        e.preventDefault();
        const nextIndex = e.shiftKey
          ? (current - 1 + focusables.length) % focusables.length
          : (current + 1) % focusables.length;
        focusables[nextIndex]?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Desktop: dropdown */}
      <div ref={containerRef} className={cn("relative hidden md:block", className)}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Switch language. Current: ${lang(locale)}`}
          className={cn(
            "whitespace-nowrap flex items-center justify-between gap-2 min-w-[100px] text-sm font-medium px-2.5 py-1.5 rounded-md border border-border transition-colors",
            isOpen ? "ring-1 ring-border bg-muted" : "hover:bg-muted"
          )}
        >
          <span className="flex items-center gap-1.5">
            <Globe
              size={14}
              className={cn("text-muted-foreground", isNavigating && "animate-spin")}
            />
            {lang(locale)}
          </span>
          <ChevronDown
            size={14}
            className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              role="listbox"
              className="absolute right-0 mt-1.5 min-w-[140px] py-1 rounded-lg border border-border bg-white/95 backdrop-blur-md shadow-lg"
            >
              {LOCALES.map((l, i) => {
                const active = l === locale;
                return (
                  <button
                    key={l}
                    ref={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSwitch(l)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                      active && "font-medium"
                    )}
                  >
                    <Check
                      size={14}
                      className={cn("shrink-0", active ? "text-indigo-600" : "text-transparent")}
                    />
                    {lang(l)}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: radio-style row, always visible */}
      <div
        role="radiogroup"
        aria-label="Language"
        className={cn("flex md:hidden items-center gap-2", className)}
      >
        {LOCALES.map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSwitch(l)}
              className={cn(
                "whitespace-nowrap flex items-center gap-2 px-2.5 py-2 text-sm rounded-md border border-border transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-3 w-3 items-center justify-center rounded-full border",
                  active ? "border-indigo-600" : "border-border"
                )}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
              </span>
              {lang(l)}
            </button>
          );
        })}
      </div>
    </>
  );
}
