"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { playLeverSound, playReelSettleTick } from "@/lib/casino-sounds";
import { computeScrollSpeed, applyScrollSpeed, decayIntensity } from "@/lib/scroll-intensity";

const MUTE_STORAGE_KEY = "casino-muted";

function detectCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

interface CasinoContextValue {
  playKey: number;
  triggerPlay: () => void;
  muted: boolean;
  toggleMute: () => void;
  playLever: () => void;
  playReelTick: (intensity?: number) => void;
  /** 0 (idle/slow scroll) → 1 (hard/fast scroll). Read on-demand, not reactive. */
  getScrollIntensity: () => number;
  /** Called by a `ReelReveal` when its settle animation starts/stops, so the
   *  sound layer knows how much text is actually moving on screen right now. */
  registerReelActive: () => void;
  unregisterReelActive: () => void;
}

const CasinoContext = createContext<CasinoContextValue>({
  playKey: 0,
  triggerPlay: () => {},
  muted: false,
  toggleMute: () => {},
  playLever: () => {},
  playReelTick: () => {},
  getScrollIntensity: () => 0,
  registerReelActive: () => {},
  unregisterReelActive: () => {},
});

// A tiny external store over localStorage's mute flag: `toggleMute` writes
// to storage and notifies listeners via a custom event, so
// useSyncExternalStore is the single source of truth for `muted` — no
// separate useState/effect needed to "adopt" a persisted value after
// mount. Its distinct server snapshot (`false`) is what avoids a
// hydration mismatch: the header's mute button (icon, `aria-label`,
// `aria-pressed`) all branch on this value, and the server always
// renders the unmuted state since it has no access to localStorage.
const MUTED_CHANGE_EVENT = "casino-muted-change";

function subscribeMuted(onChange: () => void) {
  window.addEventListener(MUTED_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(MUTED_CHANGE_EVENT, onChange);
}

function getMutedSnapshot() {
  return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
}

function getServerMutedSnapshot() {
  return false;
}

export function CasinoProvider({ children }: { children: React.ReactNode }) {
  const [playKey, setPlayKey] = useState(0);
  const muted = useSyncExternalStore(
    subscribeMuted,
    getMutedSnapshot,
    getServerMutedSnapshot
  );
  const audioContextRef = useRef<AudioContext | null>(null);

  // Scroll-velocity tracking, kept entirely in refs (no re-renders on every
  // scroll frame). `getScrollIntensity()` is read on-demand by ReelReveal
  // instances and the sound layer when a reel settles, so a hard/fast
  // scroll makes both the visual settle and its sound "hit harder".
  const scrollIntensityRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const lastScrollTRef = useRef(0);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    lastScrollTRef.current = performance.now();

    // Detected once per mount, not per scroll event — a session doesn't
    // switch input types mid-visit, so this doesn't need to be reactive.
    const isCoarsePointer = detectCoarsePointer();

    let decayFrame: number;

    const onScroll = () => {
      const y = window.scrollY;
      const t = performance.now();
      const dt = Math.max(t - lastScrollTRef.current, 1);
      const dy = y - lastScrollYRef.current;
      const speed = computeScrollSpeed(dy, dt, isCoarsePointer);

      scrollIntensityRef.current = applyScrollSpeed(scrollIntensityRef.current, speed);

      lastScrollYRef.current = y;
      lastScrollTRef.current = t;
    };

    // Continuously decay intensity back toward 0 so it reflects *recent*
    // scroll speed rather than staying pinned at its peak forever.
    const decay = () => {
      scrollIntensityRef.current = decayIntensity(scrollIntensityRef.current);
      decayFrame = requestAnimationFrame(decay);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    decayFrame = requestAnimationFrame(decay);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(decayFrame);
    };
  }, []);

  const getScrollIntensity = useCallback(() => scrollIntensityRef.current, []);

  // How many `ReelReveal` instances are actively scrambling right now.
  // Used to scale the settle-tick volume so the sound reflects how much
  // text is *actually visibly moving* — with only a heading or two on
  // screen (the common case), a hard scroll stays quiet instead of
  // producing a loud "hit" for barely any motion.
  const activeReelCountRef = useRef(0);
  const registerReelActive = useCallback(() => {
    activeReelCountRef.current += 1;
  }, []);
  const unregisterReelActive = useCallback(() => {
    activeReelCountRef.current = Math.max(0, activeReelCountRef.current - 1);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !(window.localStorage.getItem(MUTE_STORAGE_KEY) === "true");
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(next));
    window.dispatchEvent(new Event(MUTED_CHANGE_EVENT));
  }, []);

  // Lazily create the AudioContext on first use so we respect the
  // browser's autoplay policy (must be triggered by a user gesture).
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;

    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }, []);

  const playLever = useCallback(() => {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    playLeverSound(ctx);
  }, [muted, getAudioContext]);

  // Called by `ReelReveal` instances both repeatedly while actively
  // "spinning" during a scroll and once at final settle — this is what
  // makes text sound like it's genuinely moving as you scroll, "spinning
  // the wheel" the harder/faster you go. `intensity` (0–1, current scroll
  // speed) scales volume/pitch so a hard scroll hits harder, but only in
  // proportion to how many reels are actually moving right now
  // (activeReelCountRef) — a single small label spinning alone stays a
  // light tick rather than a loud thump, since there's barely any visible
  // motion to back that up. Stable identity (via useCallback) matters here
  // since `ReelReveal` lists it as an effect dependency; a fresh function
  // each render would restart every reel.
  const playReelTick = useCallback((intensity = 0) => {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    // 1 active reel → quiet baseline; 3+ simultaneously spinning → full
    // intensity is allowed through. Ramps smoothly in between.
    const presence = Math.min(activeReelCountRef.current / 3, 1);
    playReelSettleTick(ctx, intensity * presence);
  }, [muted, getAudioContext]);

  const triggerPlay = useCallback(() => setPlayKey((k) => k + 1), []);

  return (
    <CasinoContext.Provider
      value={{
        playKey,
        triggerPlay,
        muted,
        toggleMute,
        playLever,
        playReelTick,
        getScrollIntensity,
        registerReelActive,
        unregisterReelActive,
      }}
    >
      {children}
    </CasinoContext.Provider>
  );
}

export function useCasino() {
  return useContext(CasinoContext);
}
