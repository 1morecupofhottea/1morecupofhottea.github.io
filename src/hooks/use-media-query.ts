"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

export function useMediaQuery(query: string): boolean {
  // useSyncExternalStore is the purpose-built hook for subscribing to
  // external browser APIs like matchMedia. Its distinct server snapshot
  // (always `false`) ensures the first client render matches SSR output,
  // avoiding a hydration mismatch — the real value is read via
  // getSnapshot on the client only, after mount.
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false
  );
}
