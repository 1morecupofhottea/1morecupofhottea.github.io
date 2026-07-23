"use client";

import dynamic from "next/dynamic";

// These three are always invisible on first render (session-gated intro/
// loading overlays, or a resume-click flash) and have no SSR value — they
// only ever render once client-side state flips them on. Deferring them off
// the initial hydration bundle keeps that bundle smaller without changing
// what the user sees or when they see it.
//
// `next/dynamic` with `ssr: false` can't be called directly inside a Server
// Component (the root locale layout), so this thin client-component wrapper
// owns the dynamic imports and is itself rendered from the server layout.
const CasinoIntro = dynamic(
  () => import("@/components/casino/casino-intro").then((m) => m.CasinoIntro),
  { ssr: false }
);
const InitialLoading = dynamic(
  () => import("@/components/casino/initial-loading").then((m) => m.InitialLoading),
  { ssr: false }
);
const ResumeLoadingOverlay = dynamic(
  () =>
    import("@/components/casino/resume-loading-overlay").then(
      (m) => m.ResumeLoadingOverlay
    ),
  { ssr: false }
);

export function DeferredOverlays() {
  return (
    <>
      <CasinoIntro />
      <InitialLoading />
      <ResumeLoadingOverlay />
    </>
  );
}
