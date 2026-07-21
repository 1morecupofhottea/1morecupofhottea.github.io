# Portfolio Enhancement — Full Implementation Spec

> **Last updated**: 2026-07-16
> This file is the single source of truth for all animation and interaction work.
> It covers what is already shipped and what still needs to be built.

---

## Status Overview

| Work | Status |
|---|---|
| Premium animations (orbs, magnetic buttons, 3D tilt, counters, spring transitions) | ✅ Done |
| Skill Gacha widget (floating FAB + modal) | ✅ Done — **will be deleted** in Part 2 |
| **Casino Redesign** (reel-reveal everywhere, intro sequence, PLAY button) | 🔲 TODO |

---

## PART 1 — Premium Animations (Already Shipped)

The following was implemented by the dev. No further changes needed unless noted.

### What was built

| Feature | File | Notes |
|---|---|---|
| Floating gradient orbs + scroll parallax | `hero.tsx` | 3 blurred orbs, `useScroll` + `useTransform` |
| Magnetic CTA buttons | `hero.tsx` | `MagneticButton` component, spring physics |
| Character-level text reveal | `hero.tsx` | `AnimatedHeadline` — **will be replaced in Part 2** |
| Animated stat counters | `about-section.tsx` | `Counter` component, `useInView` + `setInterval` |
| Direction-aware 3D card tilt | `project-card.tsx` | `perspective: 1200px`, ±12° rotation |
| Card shine overlay | `project-card.tsx` | Radial gradient following mouse |
| Staggered project card reveal | `project-grid.tsx` | `staggerChildren: 0.12`, `whileInView` |
| Section spring transitions | `section-wrapper.tsx` | `type: spring, stiffness: 80, damping: 20` |
| Section gradient backgrounds | `globals.css` | `gradient-shift` keyframe, 20s cycle |
| Tech badge spring hover | `tech-badge.tsx` | `scale: 1.08`, spring |
| Gold CSS variables | `globals.css` | `--color-gold`, `--color-gold-light`, `--color-gold-dark` |
| Skill Gacha FAB + modal | `interactive/` folder | **DELETE in Part 2** |

Everything in Part 1 keeps working after Part 2. Only `AnimatedHeadline` in `hero.tsx` is replaced.

---

## PART 2 — Casino Redesign

### Vision

The portfolio IS the slot machine. Content never fades in — it **reels in**.
Light mode and indigo color palette stay unchanged. Only the animation pattern changes.

| Moment | Experience |
|---|---|
| First page load | Full-screen white overlay: 3 slot reels spin → settle on Name / Title / Specialty. Fades out after ~3s. Once per session only. Click anywhere to skip. |
| Scroll into any section | Every heading, badge, project title, experience date scrambles through random chars (A–Z, 0–9, ♠♣♥♦) → settles on the real text. |
| Scroll back up | Content resets to scrambled state while off-screen. Scroll back down → reels in again. |
| Click **PLAY** in header | All visible reel animations on screen re-spin and re-settle immediately. |
| Navigate to another page | `loading.tsx` shows 3 bouncing suit symbols while the route loads. |

---

### What Changes vs. Current State

| Current | New |
|---|---|
| `AnimatedHeadline` — 3D flip per char | `ReelReveal` — slot scramble → settle |
| Scale-in stagger on skill badges | Text inside each badge scrambles → settles (wave across grid) |
| Floating FAB + gacha modal | **Deleted entirely** |
| No PLAY button in header | **♠ PLAY** button added next to Resume |
| No loading screen | `loading.tsx` with bouncing suit symbols |
| No intro animation | `CasinoIntro` — first-load 3-reel sequence |

---

### New File Structure

```
src/
├── lib/
│   └── reel-utils.ts                       NEW — charset + scramble helpers
│
├── components/
│   └── casino/
│       ├── reel-reveal.tsx                 NEW — core text-scramble primitive
│       ├── slot-badge.tsx                  NEW — skill badge using ReelReveal
│       ├── casino-intro.tsx                NEW — first-load overlay sequence
│       └── casino-provider.tsx             NEW — global playKey context
│
└── app/
    └── loading.tsx                         NEW — route loading UI

Modified:
├── app/layout.tsx
├── app/globals.css
├── components/layout/header.tsx
├── components/sections/hero.tsx
├── components/sections/about-section.tsx
├── components/sections/skills-section.tsx
├── components/project/project-card.tsx
├── components/sections/experience-timeline.tsx
├── components/shared/section-label.tsx
├── messages/en.json
└── messages/ja.json

Deleted:
├── components/interactive/skill-gacha.tsx
├── components/interactive/floating-fab.tsx
└── components/interactive/gacha-provider.tsx
```

---

## Section 1 — `src/lib/reel-utils.ts` (NEW)

Shared constants and helpers. Every casino component imports from here.

```typescript
/** Characters used when a reel slot is scrambling */
export const CHARSET_ALPHA   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
export const CHARSET_NUM     = "0123456789"
export const CHARSET_CASINO  = "♠♣♥♦★☆◆◇"
export const CHARSET_FULL    = CHARSET_ALPHA + CHARSET_NUM + CHARSET_CASINO

export function randomChar(charset = CHARSET_FULL): string {
  return charset[Math.floor(Math.random() * charset.length)]
}

/**
 * Returns a scrambled version of `text`.
 * Spaces are always preserved — they never scramble.
 */
export function scrambleText(text: string): string {
  return text
    .split("")
    .map((char) => (char === " " ? " " : randomChar()))
    .join("")
}

/**
 * Speed presets — controls how fast characters settle left-to-right.
 *
 * fast   → ~600ms  total  (short labels, dates)
 * medium → ~1000ms total  (section headings)
 * slow   → ~1500ms total  (intro overlay)
 */
export const REEL_SPEED = {
  fast:   { interval: 30,  settleChance: 0.18 },
  medium: { interval: 50,  settleChance: 0.10 },
  slow:   { interval: 70,  settleChance: 0.06 },
} as const

export type ReelSpeed = keyof typeof REEL_SPEED
```

---

## Section 2 — `src/components/casino/reel-reveal.tsx` (NEW)

The **core primitive**. Drop it around any text to make it scramble → settle.

### Behavior

1. **SSR**: renders the real `text` (SEO-safe, screen-reader-accessible).
2. **After mount**: immediately scrambles to random chars.
3. **On scroll into view**: characters settle left-to-right in a wave.
4. **On scroll out** (`once: false`): text resets to scrambled (off-screen, invisible).
5. **On `playKey` change**: re-scrambles and re-settles regardless of scroll position.
6. **`prefers-reduced-motion`**: skips all scrambling, renders real text immediately.

### Accessibility

Wrapper gets `aria-label={text}`. Scrambled characters are inside `aria-hidden="true"`.
Screen readers always read the real text.

### Code

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "framer-motion"
import { scrambleText, REEL_SPEED, type ReelSpeed } from "@/lib/reel-utils"

interface ReelRevealProps {
  /** The real text to reveal */
  text: string
  /** HTML tag to render. Default: "span" */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"
  className?: string
  style?: React.CSSProperties
  /** Animation speed preset. Default: "medium" */
  speed?: ReelSpeed
  /**
   * Bumping this number re-triggers the animation.
   * Pass `playKey` from `useCasino()` to every ReelReveal
   * so the header PLAY button can re-spin everything.
   */
  playKey?: number
  /**
   * true  → animates only on first viewport entry (good for hero, above-fold)
   * false → re-animates every time element re-enters viewport (default)
   */
  once?: boolean
}

export function ReelReveal({
  text,
  as: Tag = "span",
  className,
  style,
  speed = "medium",
  playKey = 0,
  once = false,
}: ReelRevealProps) {
  const prefersReducedMotion = useReducedMotion()
  const [displayText, setDisplayText] = useState(text)   // real text on SSR
  const [isMounted, setIsMounted] = useState(false)
  // Internal counter so playKey changes always re-trigger even if already in view
  const [animTrigger, setAnimTrigger] = useState(0)

  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once, margin: "-60px" })

  // Hydration: scramble immediately after first client render
  useEffect(() => {
    setIsMounted(true)
    if (!prefersReducedMotion) setDisplayText(scrambleText(text))
  }, [text, prefersReducedMotion])

  // PLAY button: re-scramble + re-trigger
  useEffect(() => {
    if (!isMounted || prefersReducedMotion || playKey === 0) return
    setDisplayText(scrambleText(text))
    setAnimTrigger((n) => n + 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey])

  // Settle animation: runs when in view OR animTrigger changes
  useEffect(() => {
    if (!isMounted || prefersReducedMotion) return

    if (!isInView && playKey === 0) {
      // Element left viewport → reset to scrambled for next entry
      if (!once) setDisplayText(scrambleText(text))
      return
    }

    const { interval, settleChance } = REEL_SPEED[speed]
    const chars = text.split("")
    const settled = new Array(chars.length).fill(false)

    const tick = setInterval(() => {
      setDisplayText(
        chars
          .map((char, i) => {
            if (char === " " || settled[i]) return char
            // Earlier positions have a higher settle chance → left-to-right wave
            const positionBonus = (1 - i / chars.length) * 0.15
            if (Math.random() < settleChance + positionBonus) {
              settled[i] = true
              return char
            }
            const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789♠♣♥♦"
            return CHARSET[Math.floor(Math.random() * CHARSET.length)]
          })
          .join("")
      )
      // All non-space characters have settled → done
      if (chars.every((c, i) => settled[i] || c === " ")) {
        clearInterval(tick)
        setDisplayText(text)
      }
    }, interval)

    return () => clearInterval(tick)
  // animTrigger is intentionally included so PLAY button re-runs this effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, animTrigger, isMounted])

  return (
    // @ts-expect-error — dynamic tag with forwarded ref
    <Tag ref={ref} className={className} style={style} aria-label={text}>
      <span aria-hidden="true">{displayText}</span>
    </Tag>
  )
}
```

### Usage examples

```tsx
import { ReelReveal } from "@/components/casino/reel-reveal"
import { useCasino } from "@/components/casino/casino-provider"

// Inside any component:
const { playKey } = useCasino()

// Section heading
<ReelReveal
  text="Tools & Technologies"
  as="h2"
  speed="medium"
  playKey={playKey}
  className="font-semibold mb-12 block"
  style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
/>

// Short label or date (fast)
<ReelReveal text="2024 — Present" speed="fast" playKey={playKey} className="text-xs font-medium text-indigo-600" />

// Hero headline (once=true — above the fold, no need to re-reel on scroll out)
<ReelReveal text={title} as="h1" speed="medium" once={true} playKey={playKey} className="font-bold ..." />
```

---

## Section 3 — `src/components/casino/slot-badge.tsx` (NEW)

Skill badge where the text inside uses `ReelReveal`. Replaces `TechBadge` in `SkillsSection`.

```tsx
"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ReelReveal } from "@/components/casino/reel-reveal"
import { useCasino } from "@/components/casino/casino-provider"

interface SlotBadgeProps {
  name: string
}

export function SlotBadge({ name }: SlotBadgeProps) {
  const prefersReducedMotion = useReducedMotion()
  const { playKey } = useCasino()

  return (
    <motion.span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                 bg-indigo-50 text-indigo-700 border border-indigo-100
                 hover:bg-indigo-100 transition-colors"
      whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      {prefersReducedMotion ? (
        name
      ) : (
        <ReelReveal
          text={name}
          speed="fast"
          playKey={playKey}
          once={false}
        />
      )}
    </motion.span>
  )
}
```

**Visual effect**: The existing `staggerChildren: 0.06` in `SkillsSection` staggers *when each badge container appears*. Inside each container, the text scrambles. Result: a wave of slot machines settling across the skills grid.

---

## Section 4 — `src/components/casino/casino-provider.tsx` (NEW)

Global context holding `playKey`. Replaces `gacha-provider.tsx`.
The PLAY button in the header calls `triggerPlay()` which bumps `playKey`.
Every `ReelReveal` and `SlotBadge` receives `playKey` and re-animates when it changes.

```tsx
"use client"

import { createContext, useContext, useState } from "react"

interface CasinoContextValue {
  playKey: number
  triggerPlay: () => void
}

const CasinoContext = createContext<CasinoContextValue>({
  playKey: 0,
  triggerPlay: () => {},
})

export function CasinoProvider({ children }: { children: React.ReactNode }) {
  const [playKey, setPlayKey] = useState(0)

  return (
    <CasinoContext.Provider
      value={{
        playKey,
        triggerPlay: () => setPlayKey((k) => k + 1),
      }}
    >
      {children}
    </CasinoContext.Provider>
  )
}

export function useCasino() {
  return useContext(CasinoContext)
}
```

---

## Section 5 — `src/components/casino/casino-intro.tsx` (NEW)

Full-screen white overlay on first page load. Shows once per browser session
(uses `sessionStorage`). Click anywhere to skip.

### Intro sequence timing

| Time | Event |
|---|---|
| 0 ms | White overlay fades in (200ms) |
| 200 ms | 3 reel windows appear; all scrambling rapidly |
| 900 ms | Reel 1 slows and settles → **developer name** |
| 1 600 ms | Reel 2 slows and settles → **job title** |
| 2 100 ms | Reel 3 slows and settles → **specialty** |
| 2 600 ms | Gold accent line fades in below reels |
| 2 800 ms | Overlay begins fade out (400ms) |
| 3 200 ms | Component unmounts |

### Code

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { scrambleText, REEL_SPEED } from "@/lib/reel-utils"
import { SITE } from "@/lib/constants"

const SESSION_KEY = "casino-intro-shown"

/** A single reel that fast-scrambles then settles on `target` after `delay` ms */
function IntroReel({ target, delay }: { target: string; delay: number }) {
  const [display, setDisplay] = useState(() => scrambleText(target))
  const [isSettled, setIsSettled] = useState(false)

  useEffect(() => {
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789♠♣♥♦"

    // Phase 1: fast random scramble until delay expires
    const fastInterval = setInterval(() => {
      setDisplay(scrambleText(target))
    }, 40)

    // Phase 2: switch to settling animation
    const settleTimer = setTimeout(() => {
      clearInterval(fastInterval)

      const chars = target.split("")
      const settled = new Array(chars.length).fill(false)
      const { interval, settleChance } = REEL_SPEED.slow

      const tick = setInterval(() => {
        setDisplay(
          chars
            .map((char, i) => {
              if (char === " " || settled[i]) return char
              const bonus = (1 - i / chars.length) * 0.2
              if (Math.random() < settleChance + bonus) {
                settled[i] = true
                return char
              }
              return CHARSET[Math.floor(Math.random() * CHARSET.length)]
            })
            .join("")
        )
        if (chars.every((c, i) => settled[i] || c === " ")) {
          clearInterval(tick)
          setDisplay(target)
          setIsSettled(true)
        }
      }, interval)
    }, delay)

    return () => {
      clearInterval(fastInterval)
      clearTimeout(settleTimer)
    }
  }, [target, delay])

  return (
    <div
      className={`font-mono text-center text-base sm:text-lg font-bold tracking-widest
                  transition-colors duration-300 ${
                    isSettled ? "text-indigo-600" : "text-muted-foreground"
                  }`}
    >
      {display}
    </div>
  )
}

export function CasinoIntro() {
  const prefersReducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) return
    if (typeof sessionStorage === "undefined") return
    if (sessionStorage.getItem(SESSION_KEY)) return

    setVisible(true)
    sessionStorage.setItem(SESSION_KEY, "1")

    const timer = setTimeout(() => setVisible(false), 3200)
    return () => clearTimeout(timer)
  }, [prefersReducedMotion])

  const reels = [
    { target: SITE.name,    delay: 700  },
    { target: SITE.title,   delay: 1400 },
    { target: SITE.tagline.split("&")[0].trim(), delay: 2100 },
  ]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setVisible(false)}
          aria-hidden="true"
        >
          {/* Decorative card suits — 4% opacity so they're barely visible */}
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-serif text-7xl opacity-[0.04]">
            <span className="absolute left-8 top-8">♠</span>
            <span className="absolute right-8 top-8">♥</span>
            <span className="absolute bottom-8 left-8">♦</span>
            <span className="absolute bottom-8 right-8">♣</span>
          </div>

          <div className="flex flex-col items-center gap-6 px-4">
            {/* Small label above reels */}
            <p className="font-mono text-xs tracking-[0.4em] text-muted-foreground/60 uppercase">
              Portfolio
            </p>

            {/* 3 reel windows */}
            <div className="flex flex-col sm:flex-row gap-4">
              {reels.map(({ target, delay }) => (
                <div
                  key={target}
                  className="relative w-full sm:w-48 overflow-hidden rounded-xl
                             border-2 border-indigo-200 bg-indigo-50/60 px-4 py-5"
                  style={{ boxShadow: "inset 0 2px 10px rgba(79,70,229,0.07)" }}
                >
                  {/* Top/bottom gradient masks give the "reel window" illusion */}
                  <div className="pointer-events-none absolute left-0 right-0 top-0 h-5 bg-gradient-to-b from-indigo-50/80 to-transparent" />
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-indigo-50/80 to-transparent" />
                  <IntroReel target={target} delay={delay} />
                </div>
              ))}
            </div>

            {/* Gold separator line — appears after all reels settle */}
            <motion.div
              className="h-px w-64 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.4 }}
            />

            <p className="text-xs text-muted-foreground/50">
              Click anywhere to skip
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## Section 6 — `src/app/loading.tsx` (NEW)

Shown by Next.js App Router during route-level data loading (blog posts, project detail pages, etc.).
Target duration: under 1 second.

```tsx
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-5 bg-white"
      aria-label="Loading"
      role="status"
    >
      {/* 3 bouncing suit symbols with staggered delay */}
      <div className="flex gap-3">
        {(["♠", "♣", "♥"] as const).map((suit, i) => (
          <div
            key={suit}
            className="flex h-10 w-10 items-center justify-center rounded-xl
                       border border-indigo-200 bg-indigo-50 text-lg font-bold text-indigo-600"
            style={{
              animation: `spin-bounce 0.8s ease-in-out ${i * 0.14}s infinite`,
            }}
          >
            {suit}
          </div>
        ))}
      </div>
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Loading...
      </p>
    </div>
  )
}
```

The `spin-bounce` keyframe is added to `globals.css` (see Section 12).

---

## Section 7 — Header: Add PLAY Button

**File**: `src/components/layout/header.tsx`

### Diff

```tsx
// 1. Add import at top
import { useCasino } from "@/components/casino/casino-provider"

// 2. Inside Header() component body, after existing hooks:
const { triggerPlay } = useCasino()
const tCasino = useTranslations("Casino")   // add this alongside existing `const t = useTranslations("Nav")`

// 3. In the desktop <nav>, insert this button between LanguageSwitcher and Resume:
<button
  onClick={triggerPlay}
  className="play-btn-pulse flex items-center gap-1.5 rounded-lg border border-indigo-200
             bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700
             transition-colors hover:bg-indigo-100 focus:outline-none
             focus-visible:ring-2 focus-visible:ring-indigo-400"
  aria-label={tCasino("play")}
>
  <span aria-hidden="true">♠</span>
  {tCasino("play")}
</button>

// 4. In the mobile <nav> (inside AnimatePresence block), add the same button
//    after LanguageSwitcher and before the nav links list.
```

Desktop nav visual result:
```
[ Name ]  About  Skills  ...  |  🌐  [ ♠ PLAY ]  [ Resume ]
```

---

## Section 8 — Hero Section

**File**: `src/components/sections/hero.tsx`

### Remove `AnimatedHeadline`, replace with `ReelReveal`

```tsx
// 1. Remove the entire AnimatedHeadline function (lines 67–94 in current file)

// 2. Add imports
import { ReelReveal } from "@/components/casino/reel-reveal"
import { useCasino } from "@/components/casino/casino-provider"

// 3. Inside Hero() add:
const { playKey } = useCasino()

// 4. Replace the <motion.h1> block that currently wraps <AnimatedHeadline>:
// BEFORE:
<motion.h1
  variants={item}
  className="font-bold leading-[1.1] tracking-tight mb-6"
  style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
>
  <AnimatedHeadline text={title} />
  <br />
  <span className="text-muted-foreground">{site("tagline")}</span>
</motion.h1>

// AFTER:
<motion.h1
  variants={item}
  className="font-bold leading-[1.1] tracking-tight mb-6"
  style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
>
  <ReelReveal
    text={title}
    speed="medium"
    once={true}
    playKey={playKey}
  />
  <br />
  <span className="text-muted-foreground">{site("tagline")}</span>
</motion.h1>
```

`once={true}` because the hero is always above the fold. PLAY button still re-triggers via `playKey`.

Everything else in `hero.tsx` stays unchanged (orbs, magnetic buttons, scroll parallax, stats, scroll arrow).

---

## Section 9 — About Section

**File**: `src/components/sections/about-section.tsx`

```tsx
// 1. Add imports
import { ReelReveal } from "@/components/casino/reel-reveal"
import { useCasino } from "@/components/casino/casino-provider"

// 2. Inside AboutSection() add:
const { playKey } = useCasino()

// 3. Replace the static h2:
// BEFORE:
<h2 className="font-semibold mb-6" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
  {t("heading")}
</h2>

// AFTER:
<ReelReveal
  text={t("heading")}
  as="h2"
  speed="medium"
  playKey={playKey}
  className="font-semibold mb-6 block"
  style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
/>
```

`Counter` components for the stat cards stay unchanged.

---

## Section 10 — Skills Section

**File**: `src/components/sections/skills-section.tsx`

```tsx
// 1. Remove import:
// import { TechBadge } from "@/components/shared/tech-badge"

// 2. Add imports:
import { SlotBadge } from "@/components/casino/slot-badge"
import { ReelReveal } from "@/components/casino/reel-reveal"
import { useCasino } from "@/components/casino/casino-provider"

// 3. Inside SkillsSection() add:
const { playKey } = useCasino()

// 4. Replace heading h2:
// BEFORE:
<h2 className="font-semibold mb-12" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
  {t("heading")}
</h2>

// AFTER:
<ReelReveal
  text={t("heading")}
  as="h2"
  speed="medium"
  playKey={playKey}
  className="font-semibold mb-12 block"
  style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
/>

// 5. Replace TechBadge with SlotBadge in the skills map:
// BEFORE:
<TechBadge name={skill} />

// AFTER:
<SlotBadge name={skill} />
```

The existing `motion.div` container with `staggerChildren: 0.06` and `whileInView` stays unchanged.
Visual result: badge containers scale in (existing) + text inside each badge scrambles → settles (new).

---

## Section 11 — Project Card

**File**: `src/components/project/project-card.tsx`

```tsx
// 1. Add imports:
import { ReelReveal } from "@/components/casino/reel-reveal"
import { useCasino } from "@/components/casino/casino-provider"

// 2. Inside ProjectCard() add:
const { playKey } = useCasino()

// 3. Replace the static h3 title:
// BEFORE:
<h3 className="font-semibold text-base leading-tight group-hover:text-indigo-600 transition-colors">
  {project.title}
</h3>

// AFTER:
<ReelReveal
  text={project.title}
  as="h3"
  speed="fast"
  playKey={playKey}
  once={false}
  className="font-semibold text-base leading-tight group-hover:text-indigo-600 transition-colors block"
/>
```

3D tilt, shine overlay, hover effects — all untouched.

---

## Section 12 — Experience Timeline

**File**: `src/components/sections/experience-timeline.tsx`

```tsx
// 1. Add imports:
import { ReelReveal } from "@/components/casino/reel-reveal"
import { useCasino } from "@/components/casino/casino-provider"

// 2. Inside ExperienceTimeline() add:
const { playKey } = useCasino()

// 3. Replace the section heading h2:
// BEFORE:
<h2 className="font-semibold mb-12" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
  {t("heading")}
</h2>

// AFTER:
<ReelReveal
  text={t("heading")}
  as="h2"
  speed="medium"
  playKey={playKey}
  className="font-semibold mb-12 block"
  style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
/>

// 4. Inside items.map(), replace the three static fields per card:
// BEFORE:
<p className="text-xs font-medium text-indigo-600 mb-1">{item.date}</p>
<h3 className="font-semibold text-base">{item.role}</h3>
<p className="text-sm text-muted-foreground mb-3">{item.company}</p>

// AFTER:
<ReelReveal text={item.date}    speed="fast"   playKey={playKey} once={false} className="text-xs font-medium text-indigo-600 mb-1 block" />
<ReelReveal text={item.role}    speed="medium" playKey={playKey} once={false} as="h3" className="font-semibold text-base block" />
<ReelReveal text={item.company} speed="fast"   playKey={playKey} once={false} className="text-sm text-muted-foreground mb-3 block" />
```

`item.description` and tag chips are **not** given `ReelReveal` — keeping the card readable.

---

## Section 13 — Section Label

**File**: `src/components/shared/section-label.tsx`

This is currently a server component. Convert it to `"use client"` to use `useCasino`.

```tsx
"use client"

import { ReelReveal } from "@/components/casino/reel-reveal"
import { useCasino } from "@/components/casino/casino-provider"

interface SectionLabelProps {
  number: string
  total: string
  title: string
}

export function SectionLabel({ number, total, title }: SectionLabelProps) {
  const { playKey } = useCasino()

  return (
    <p className="section-label text-sm font-medium tracking-widest text-muted-foreground uppercase mb-4">
      <span className="text-[var(--color-indigo)]">{number}</span>
      <span className="mx-1 opacity-40">/</span>
      <span className="opacity-40">{total}</span>
      <span className="mx-3 opacity-40">—</span>
      <ReelReveal text={title} speed="fast" playKey={playKey} once={false} />
    </p>
  )
}
```

---

## Section 14 — Layout

**File**: `src/app/layout.tsx`

```tsx
// 1. Remove import:
// import { GachaProvider } from "@/components/interactive/gacha-provider"

// 2. Add imports:
import { CasinoProvider } from "@/components/casino/casino-provider"
import { CasinoIntro } from "@/components/casino/casino-intro"

// 3. Inside the JSX, replace <GachaProvider /> with CasinoProvider wrapper + CasinoIntro:
// BEFORE:
<NextIntlClientProvider messages={messages}>
  <Header />
  <main className="flex-1">{children}</main>
  <Footer />
  <GachaProvider />
</NextIntlClientProvider>

// AFTER:
<NextIntlClientProvider messages={messages}>
  <CasinoProvider>
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
    <CasinoIntro />
  </CasinoProvider>
</NextIntlClientProvider>
```

`CasinoProvider` must wrap `Header` because the PLAY button inside `Header` calls `useCasino()`.

---

## Section 15 — globals.css Additions

Append to the end of `src/app/globals.css`:

```css
/* --- Casino: loading screen bounce --- */
@keyframes spin-bounce {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: translateY(-8px) rotate(180deg);
    opacity: 0.7;
  }
}

/* --- Casino: PLAY button ambient pulse --- */
@keyframes play-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.25); }
  50%       { box-shadow: 0 0 0 7px rgba(79, 70, 229, 0); }
}

.play-btn-pulse {
  animation: play-pulse 2.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .play-btn-pulse {
    animation: none;
  }
}
```

---

## Section 16 — i18n Keys

**File**: `messages/en.json` — add `"Casino"` namespace at the top level:

```json
"Casino": {
  "play": "PLAY",
  "loading": "Loading...",
  "introSkip": "Click to skip"
}
```

**File**: `messages/ja.json` — add:

```json
"Casino": {
  "play": "プレイ",
  "loading": "読込中...",
  "introSkip": "クリックでスキップ"
}
```

Update `header.tsx` to use:
```tsx
const tCasino = useTranslations("Casino")
// then: {tCasino("play")}
```

---

## Section 17 — Delete Old Gacha Files

```bash
rm src/components/interactive/skill-gacha.tsx
rm src/components/interactive/floating-fab.tsx
rm src/components/interactive/gacha-provider.tsx
```

---

## Complete File Change Table

| Action | File | What changes |
|---|---|---|
| **Create** | `src/lib/reel-utils.ts` | Charset constants, `scrambleText()`, `REEL_SPEED` presets |
| **Create** | `src/components/casino/reel-reveal.tsx` | Core scramble primitive used everywhere |
| **Create** | `src/components/casino/slot-badge.tsx` | Skill badge with reel text (replaces TechBadge in skills) |
| **Create** | `src/components/casino/casino-intro.tsx` | First-load 3-reel overlay, sessionStorage guard |
| **Create** | `src/components/casino/casino-provider.tsx` | `playKey` context, replaces `gacha-provider` |
| **Create** | `src/app/loading.tsx` | Route loading UI with bouncing suit symbols |
| **Modify** | `src/app/layout.tsx` | Swap `GachaProvider` → `CasinoProvider` + `CasinoIntro` |
| **Modify** | `src/app/globals.css` | Add `spin-bounce`, `play-pulse` keyframes |
| **Modify** | `src/components/layout/header.tsx` | Add ♠ PLAY button, `useCasino`, `useTranslations("Casino")` |
| **Modify** | `src/components/sections/hero.tsx` | Remove `AnimatedHeadline` fn → `ReelReveal`; add `useCasino` |
| **Modify** | `src/components/sections/about-section.tsx` | heading `h2` → `ReelReveal`; add `useCasino` |
| **Modify** | `src/components/sections/skills-section.tsx` | `TechBadge` → `SlotBadge`; heading → `ReelReveal`; add `useCasino` |
| **Modify** | `src/components/project/project-card.tsx` | Project `title` h3 → `ReelReveal`; add `useCasino` |
| **Modify** | `src/components/sections/experience-timeline.tsx` | `date`, `role`, `company` per card → `ReelReveal`; heading → `ReelReveal`; add `useCasino` |
| **Modify** | `src/components/shared/section-label.tsx` | Add `"use client"`; `title` → `ReelReveal`; add `useCasino` |
| **Modify** | `messages/en.json` | Add `Casino` namespace |
| **Modify** | `messages/ja.json` | Add `Casino` namespace |
| **Delete** | `src/components/interactive/skill-gacha.tsx` | Replaced by site-wide mechanic |
| **Delete** | `src/components/interactive/floating-fab.tsx` | Replaced by header PLAY button |
| **Delete** | `src/components/interactive/gacha-provider.tsx` | Replaced by `casino-provider.tsx` |

---

## Time Estimate

| Task | Hours |
|---|---|
| `reel-utils.ts` | 0.5 |
| `reel-reveal.tsx` — scramble loop, `useInView`, `playKey` trigger, a11y | 3.0 |
| `slot-badge.tsx` | 0.5 |
| `casino-provider.tsx` | 0.5 |
| `casino-intro.tsx` — 3-reel sequence, timing, sessionStorage | 2.5 |
| `loading.tsx` + `spin-bounce` keyframe | 0.5 |
| Header PLAY button | 0.5 |
| Hero (`ReelReveal` swap) | 0.5 |
| Skills (`SlotBadge` swap + heading) | 0.5 |
| Project card title | 0.5 |
| Experience timeline (3 fields × N cards + heading) | 0.5 |
| About + SectionLabel | 0.5 |
| Layout wiring | 0.5 |
| CSS + i18n | 0.5 |
| Delete old gacha files | 0.25 |
| Testing + polish | 1.5 |
| **Total** | **~12.75 hours (~1.5 dev days)** |

---

## Accessibility Checklist

- [ ] `ReelReveal` always has `aria-label={text}` — screen readers read real text regardless of animation
- [ ] Scrambled characters are inside `aria-hidden="true"`
- [ ] `CasinoIntro` overlay is `aria-hidden="true"` (decorative, page content is behind it)
- [ ] PLAY button has accessible label via i18n `tCasino("play")`
- [ ] `useReducedMotion()` check in `ReelReveal`: if true, skip scramble and render real text immediately
- [ ] `useReducedMotion()` check in `SlotBadge`: if true, render plain text
- [ ] `useReducedMotion()` check in `CasinoIntro`: if true, skip intro entirely
- [ ] `play-btn-pulse` animation is disabled via `prefers-reduced-motion` media query in CSS

---

## Testing Checklist

```bash
npm run lint     # zero new ESLint errors
npm run build    # zero TypeScript errors
```

**Manual test matrix**:

| Test | Pass? |
|---|---|
| EN locale: intro plays on first load (session) | |
| EN locale: intro does NOT repeat on page navigation | |
| JA locale: intro plays; PLAY button shows プレイ | |
| Hero headline reels in on page load | |
| PLAY button re-spins hero headline immediately | |
| Scroll to Skills: badges scramble → settle in left-to-right wave | |
| Scroll back up, scroll back to Skills: badges re-reel | |
| Scroll to Projects: project titles reel in | |
| PLAY button re-spins all visible project titles | |
| Scroll to Experience: date, role, company reel per card | |
| Section labels reel the title text | |
| `loading.tsx`: visible when navigating to `/projects/[slug]` | |
| `prefers-reduced-motion`: all ReelReveal show real text immediately | |
| `prefers-reduced-motion`: intro is skipped entirely | |
| Mobile 375px: intro reels fit without horizontal scroll | |
| Mobile 375px: PLAY button is accessible in mobile nav | |
| Build output: no references to deleted gacha files | |
