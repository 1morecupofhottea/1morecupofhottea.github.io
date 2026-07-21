# Custom Cursor — Dot + Ring Follower

> **Last updated**: 2026-07-16
> Builds on the existing spring-physics animation system (Framer Motion) and indigo/gold color palette.

---

## Vision

A custom cursor that replaces the native OS cursor on pointer-fine devices (mice, trackpads). Two layers — a precise dot and a spring-lagged ring — give the site a tactile, physical feel that aligns with the existing casino/playing-card motif.

**Core metaphor**: The cursor is a chip or token on a casino table — precise where you place it, with a soft "wobble" ring that settles like a chip coming to rest on felt.

---

## Behavior

### Layers

| Layer | Size | Movement | Color |
|---|---|---|---|
| **Dot** | 6px (fixed) | Snaps to pointer instantly (`left + 1px` offset for precision) | `#0b0c0e` (foreground, default) → `#4f46e5` (hover) → `#d4af37` (gold hover) |
| **Ring** | 32px (default) / 52px (hover) / 56px (gold hover) | Follows with spring: `stiffness: 250, damping: 20, mass: 0.3` | Border & fill change by state (see below) |

### States

| State | Dot | Ring Border | Ring Fill | Ring Scale |
|---|---|---|---|---|
| `default` | `#0b0c0e` | `rgba(11,12,14,0.2)` | `transparent` | 1× |
| `hover` | `#4f46e5` | `#4f46e5` | `rgba(79,70,229,0.08)` | 1.6× |
| `hover-gold` | `#d4af37` | `#d4af37` | `rgba(212,175,55,0.1)` | 1.75× |

### Hover Detection

Runs a `mousemove` handler on `document`. Checks `e.target` / `e.target.closest()` against this priority:

1. `.resume-btn-premium` → `hover-gold` state
2. `button, a, [role="button"], label, input, select, textarea` → `hover` state
3. Everything else → `default` state

No `data-cursor` attributes needed in existing components.

### Device Gating

- Only mounts on devices where `matchMedia("(pointer: fine)")` is `true` (mouse/trackpad — not touch)
- Uses `useRef` + `useEffect` to set up and tear down listeners; never renders on mobile

### Reduced Motion

When `prefers-reduced-motion` is `reduce`:
- Spring is skipped — ring follows with a static `left/top` offset instead (no animation)
- Scale transitions happen instantly (no spring duration)

---

## Files Changed

| File | Change |
|---|---|
| `src/components/shared/custom-cursor.tsx` | **New** — `"use client"` component with dot, ring, spring physics, state machine |
| `src/app/globals.css` | Add `cursor: none` to `*` under `@media (pointer: fine)` |
| `src/app/layout.tsx` | Import and render `<CustomCursor />` inside `<body>` |

---

## Component Structure (`custom-cursor.tsx`)

```
"use client"
import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"

// State type: "default" | "hover" | "hover-gold"

// Mouse position: useMotionValue for x/y
// Ring position: useSpring(x, { stiffness: 250, damping: 20, mass: 0.3 })
// Dot position: useMotionValue(x) + 1px offset, no spring

// Hover detection: mouseover listener on document
//   → check e.target.closest(selector) to determine state
//   → store in useState

// Render: only if pointerType === "fine" (check once via matchMedia)

// Render tree:
//   <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ ... }}>
//     {/* Ring */}
//     <motion.div style={{ width, height, x, y, borderRadius, border, backgroundColor }} />
//     {/* Dot */}
//     <motion.div style={{ width: 6px, height: 6px, x, y, borderRadius: "50%", backgroundColor }} />
//   </div>
```

---

## CSS Addition (`globals.css`)

```css
@media (pointer: fine) {
  * {
    cursor: none !important;
  }
}
```

Only affects mouse/trackpad users. Touch devices keep the native cursor and never see the custom cursor.

---

## Implementation Order

| Step | Description |
|---|---|
| 1 | Create `src/components/shared/custom-cursor.tsx` with dot + ring, spring tracking, hover detection |
| 2 | Add `cursor: none` to `globals.css` under `@media (pointer: fine)` |
| 3 | Add `<CustomCursor />` to `src/app/layout.tsx` |

---

## How It Connects to What Exists

| Existing System | How Cursor Uses It |
|---|---|
| Framer Motion spring physics (`stiffness/damping/mass` params used everywhere) | Ring spring: `stiffness: 250, damping: 20, mass: 0.3` — same style as MagneticButton (150/15/0.1) and card tilt (300/30) |
| `--color-indigo: #4f46e5` in globals.css | Hover dot + ring fill color |
| `--color-gold: #d4af37` / `--color-gold-dark: #b8942e` in globals.css | Gold hover state for `.resume-btn-premium` |
| `prefersReducedMotion` gating used throughout | Ring skips spring animation when motion reduced |
| `(pointer: fine)` media query | Only mounts on mouse/trackpad, never touch |
| `.resume-btn-premium` on resume CTA | Triggers gold cursor state — same class used for gold shimmer animations |
| Header + card glassmorphism (`backdrop-blur-sm`, `bg-white/70`) | Cursor ring uses matching `backdrop-blur` for elegant blending |
| Casino/playing card physical feel (3D tilt, card shine, suit markers) | Spring-ring cursor adds physical pointer presence — chip/felt metaphor |
