"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/lib/navigation";

/**
 * Tracks which section (by element id) the user has scrolled to, so nav
 * links can highlight the section currently in view.
 *
 * Approach: on every scroll tick, find the last section whose top edge has
 * crossed a fixed "active line" near the top of the viewport (just below
 * the fixed header). This is the standard scrollspy algorithm — unlike an
 * intersection-ratio comparison, it doesn't favor tall sections over short
 * ones, so short sections (e.g. Contact) remain reachable even after a
 * long section (e.g. Experience).
 *
 * Re-binds on every pathname change: the header is part of the root layout
 * and never unmounts between routes, so without this the last active
 * section from the homepage would stay stuck in state after navigating
 * away (e.g. to /blog) and back.
 */
export function useActiveSection(sectionIds: string[], offset = 120) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const pathname = usePathname();
  const hasSections = /^\/(en|ja)\/?$/.test(pathname);

  useEffect(() => {
    if (!hasSections) return;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const update = () => {
      const activeLine = offset;
      let current: string | null = null;

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= activeLine) {
          current = el.id;
        } else {
          break;
        }
      }

      // Special-case the bottom of the page: if the user has scrolled to
      // (or near) the end of the document, force the last section active
      // even if its content is shorter than the viewport, so the final
      // section (e.g. Contact) is always reachable.
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (scrolledToBottom) {
        current = elements[elements.length - 1].id;
      }

      if (current === null && window.scrollY < activeLine) {
        // Above the first section (e.g. still in the hero) — no active link.
        setActiveId(null);
        return;
      }

      if (current !== null) {
        setActiveId(current);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sectionIds, offset, hasSections]);

  // Derive the result instead of resetting state inside the effect: on a
  // route with no sections (e.g. /blog), never report a stale section id
  // left over from a previous visit to the homepage.
  return hasSections ? activeId : null;
}

