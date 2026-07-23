"use client";

import { useEffect } from "react";

/**
 * Locale-prefix redirect for the bare "/" route.
 *
 * next-intl's middleware normally handles "/" -> "/en/" locale detection,
 * but middleware cannot run at all on a static export (GitHub Pages has no
 * server/edge runtime) — see next.config.ts's `output: "export"`. Without
 * this page, a visitor landing on the bare domain would be served this
 * route's static HTML directly, with no redirect.
 *
 * The `<meta httpEquiv="refresh">` below is the primary redirect: it's
 * parsed and acted on by the browser immediately as part of loading the
 * static HTML, before React hydrates. This avoids a visible blank-page
 * flash (this page renders nothing) on slower mobile connections/CPUs,
 * where waiting for hydration + the JS effect below to fire was
 * perceptible as "the site glitches into blank/default styling, then snaps
 * to the real page."
 *
 * The `useEffect` JS redirect is kept as a fallback for the one thing a
 * meta-refresh can't reliably do: preserve a "#hash" fragment (e.g. a
 * bookmarked "/#projects" link) across the redirect in every browser.
 */
export default function RootRedirect() {
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if ((path === "/" || path === "") && hash) {
      window.location.replace("/en/" + hash);
    }
  }, []);

  return (
    <meta httpEquiv="refresh" content="0; url=/en/" />
  );
}
