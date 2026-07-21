# Casino Card Upgrade — Project & Blog Cards

> **Last updated**: 2026-07-16
> Builds on the existing casino theme (reel-reveal, suit symbols, gold palette, Web Audio).

---

## Vision

Cards are currently flat white panels with a 3D tilt wrapper — but the tilt doesn't propagate to children, the image area is a plain gradient with initials, and the border/shadow is static. The casino theme already defines the visual language (♠♣♥♦, gold, indigo, glass, backdrop-blur). This plan brings the cards fully into that system.

**Core metaphor**: These are **casino playing cards** — glossy, layered, alive under light. Each one should feel like a physical object you'd pick up off a felt table.

---

## Phase 1 — Depth & Material Feel (Highest Impact)

### 1.1 True 3D Depth Stack (`translateZ` on children)

**Current**: `transformStyle: "preserve-3d"` + perspective 1200px set on the outer wrapper, but nothing uses `translateZ`. The tilt rotates a flat slab.

**Change**: Give every logical section of the card a `translateZ()` so they visually float at different heights under the 3D tilt:

| Layer | translateZ | Element |
|---|---|---|
| Card body (base) | `8px` | `.p-6` content container |
| Image/hero area | `4px` | Gradient header background |
| Category badge | `12px` | `Badge` in top-right |
| Tag pills | `15px` | Each `.rounded-full` tag |
| Title | `20px` | Project title `h3` |
| Action links | `12px` | GitHub/Demo/Read More row |
| Shine overlay | `30px` | Existing radial gradient overlay |

**Implementation**: Add `style={{ transform: "translateZ(DISTpx)" }}` to the child elements inside `Card`.

**Why casino**: A real casino card has physical depth — ink sits on the surface, lamination adds a translucent top layer, the suit index is embossed. The `translateZ` stack mirrors that physical layering.

### 1.2 Tilt-Driven Glow Border

**Current**: Static `ring-1 ring-foreground/10` + `hover:shadow-[...]` with arbitrary values.

**Change**: Replace with a dynamic `box-shadow` that scales with tilt magnitude:

```tsx
const tiltMag = prefersReducedMotion ? 0 : Math.min(Math.abs(rotateX) + Math.abs(rotateY), 12) / 12
const glowIntensity = tiltMag * 0.6 // 0 → 0.6

// Applied to Card via style prop:
const cardStyle = {
  boxShadow: `0 ${4 + tiltMag * 8}px ${15 + tiltMag * 15}px -5px rgba(79,70,229,${glowIntensity * 0.15}),
              0 0 ${glowIntensity * 20}px ${glowIntensity * 8}px rgba(79,70,229,${glowIntensity * 0.08})`,
  // also apply the Tilt to image gradient position
}
```

**Results**:
- Resting (tilt ≈ 0): subtle shadow, no glow — same as today
- Light tilt (tilt ≈ 0.3): faint indigo bloom — card "warms up"
- Hard tilt (tilt ≈ 1.0): pronounced indigo glow — card is "hot"

**Why casino**: This mirrors the existing scroll-intensity → sound system. Hard move = hard feedback. The glow is the visual equivalent of `playReelTick(1.0)` — a "hot" card pulses under aggressive handling.

### 1.3 Casino Suit Scatter in Image Area

**Current**: `h-48` gradient block with 2-letter uppercase initials (e.g., "AI", "PO").

**Change**: Replace with a container that renders 3–4 casino suit symbols (♠♣♥♦) at randomized positions but deterministic per card (seeded by `project.slug`). Each suit has its own `translateZ` depth (6px–16px) so they parallax-shift differently under tilt.

```tsx
// Utility: deterministic "random" from slug
function seededShuffle(slug: string, count: number) {
  let hash = 0;
  for (const c of slug) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
  const suits = ["♠", "♣", "♥", "♦"];
  const indices = Array.from({ length: count }, (_, i) => ({
    i,
    v: ((hash * (i + 1)) % 100) / 100,
  }));
  return indices.map(({ i, v }) => ({
    suit: suits[Math.floor(v * suits.length) % suits.length],
    x: ((v * 397) % 100) + "%",
    y: ((v * 7919) % 100) + "%",
    z: 6 + Math.floor(v * 10), // 6–15px
    size: 1.5 + v * 2.5, // 1.5rem–4rem
    opacity: 0.04 + v * 0.06, // 4%–10%
  }));
}
```

The gradient background stays but shifts dynamically based on tilt angle (subtle parallax off the `rotateX/Y` values).

**Why casino**: Suits are the universal visual shorthand for gambling. Scattering them behind the content turns every card into a mini casino table layout.

### 1.4 Apply `.card-shine` CSS (existing, unused)

**Current**: `globals.css` lines 198–237 define `.card-shine` with a `shine-sweep` animation, but it's never applied to any element.

**Change**: Add `card-shine` class to the `Card` component's `className`. This gives every card a subtle diagonal light sweep on hover.

**Why casino**: The sweep mimics light reflecting off a glossy laminated playing card as you tilt it.

### 1.5 Glassmorphism Card Surface

**Current**: `bg-card` (`#fafafa`) — fully opaque, flat.

**Change**: Match the header's treatment:
```tsx
className="bg-white/70 backdrop-blur-sm"
```

This makes the card semi-transparent, revealing a faint hint of the section gradient background underneath. Combined with the existing `section-gradient` background (the alternating sections), cards appear to float above textured felt.

**Why casino**: Casino tables use green felt; here the "felt" is the section gradient. The semi-transparent card surface + backdrop-blur gives a physical "laminated surface" look that directly mirrors the header's glass navbar.

---

## Phase 2 — Casino Identity (Medium Impact)

### 2.1 Suit-Based Category Badge

**Current**: `Badge variant="secondary"` with plain category text (e.g., "AI", "Web").

**Change**: Map project categories to casino suits + gold styling:

```tsx
const SUIT_MAP: Record<string, { suit: string; label: string }> = {
  "AI":       { suit: "♠", label: "Spades" },
  "Web":      { suit: "♥", label: "Hearts" },
  "Mobile":   { suit: "♦", label: "Diamonds" },
  "Backend":  { suit: "♣", label: "Clubs" },
  "DevOps":   { suit: "★", label: "Star" },
  "Design":   { suit: "♦", label: "Diamonds" },
  "ML":       { suit: "♠", label: "Spades" },
  "Data":     { suit: "♣", label: "Clubs" },
};
```

Styled as a pill with `bg-gradient-to-r from-gold/10 to-gold/5 border-gold/30 text-gold-dark` — the same gold palette already used for the resume button and casino intro separator.

**Why casino**: Every casino card has a suit and rank in the corner. Mapping project categories to suits extends the visual code and gives the badge real thematic weight.

### 2.2 Suit Corner Markers

Add subtle suit markers at the top-left and bottom-right corners of the card (like real playing card indices). These are small, semi-transparent, and only appear on hover:

```tsx
// Inside Card, absolutely positioned:
{/* Top-left corner */}
<span className="absolute top-2 left-2 text-[8px] opacity-0 group-hover:opacity-30 transition-opacity font-mono text-indigo-400">
  {SUIT_MAP[project.category]?.suit ?? "♠"}
</span>
{/* Bottom-right corner (rotated 180°) */}
<span className="absolute bottom-2 right-2 text-[8px] opacity-0 group-hover:opacity-30 transition-opacity font-mono text-indigo-400 rotate-180">
  {SUIT_MAP[project.category]?.suit ?? "♠"}
</span>
```

**Why casino**: This is the most direct real-playing-card visual cue. Small enough to be invisible at rest, unmistakable on hover.

### 2.3 Sound on First Hover

**Current**: No sound is associated with cards. The existing `useCasino()` hook is already imported and available.

**Change**: Track whether the user has ever hovered this card (per card, `useRef`). On first hover, fire a single soft `playReelTick(0.15)`:

```tsx
const hasHovered = useRef(false)

const handleFirstHover = () => {
  if (!hasHovered.current && !prefersReducedMotion) {
    hasHovered.current = true
    playReelTick(0.15)
  }
}
```

Wire into the existing `onMouseMove` handler.

**Why casino**: The sound of a card being picked up off felt. Extremely subtle — almost subliminal — but reinforces the physicality.

---

## Phase 3 — Page-Level Casino Feel (Medium Impact)

### 3.1 Dealt Entry Animation

**Current**: Cards enter with `hidden: { opacity: 0, y: 30 }` → `show: { opacity: 1, y: 0 }` — a basic slide-up fade.

**Change**: Replace with a "dealing" animation. Each card:
1. Starts off-screen to the right (`x: 200, rotateZ: 15, opacity: 0`)
2. Slides left across the table toward its final position
3. Settles with a slight spring bounce

```tsx
const cardVariant = {
  hidden: { opacity: 0, x: 200, rotateZ: 15, scale: 0.9 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    rotateZ: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      type: "spring",
      stiffness: 200,
      damping: 25,
      mass: 0.5,
    },
  }),
};
```

Each card gets the delay index via `custom={i}` on the `motion.div`.

**Why casino**: Cards dealt from a shoe slide across the table and spin slightly before coming to rest. This animation directly mimics that motion.

### 3.2 Filter Animation (Projects Page)

**Current**: `ProjectFilter` switches state → React re-renders the card list instantly. No animation.

**Change**: Wrap the card grid in `AnimatePresence` and key each card by `project.slug`. When the active category changes:
- Non-matching cards: `exit` animation (scale down + fade + slight y offset)
- Matching cards: `layout` prop for smooth repositioning
- New cards enter via the "dealt" animation above

```tsx
<AnimatePresence mode="popLayout">
  {filteredProjects.map((project, i) => (
    <motion.div
      key={project.slug}
      layout
      custom={i}
      variants={cardVariant}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.85, y: 20, transition: { duration: 0.25 } }}
    >
      <ProjectCard project={project} />
    </motion.div>
  ))}
</AnimatePresence>
```

**Why casino**: The croupier sweeps losing cards off the table and deals new ones. Filtering feels like a physical action, not a state change.

### 3.3 Stagger per Row (Optional Polish)

On wide screens (3-column grid), stagger by row instead of by item index: all first-row cards enter simultaneously (0ms delay), then second row (100ms), third row (200ms). This emulates dealing row-by-row.

---

## Phase 4 — Polish & Edge Cases

### 4.1 Hover Sound Debounce

The `handleFirstHover` approach already limits to once per card. Confirm the ref is scoped per-instance (not shared across all cards). Good as-is.

### 4.2 Reduced Motion Guardrails

Every animation in Phase 1–3 must check `prefersReducedMotion`:
- 3D depth (`translateZ`) — skip, render flat
- Glow border — skip, use static shadow
- Suit parallax — skip, no offset
- Corner markers — keep (no motion involved)
- Entry animation — fall back to existing `opacity + y` (no rotation/slide)
- Filter exit — skip exit animation, instant swap

### 4.3 Performance Consideration

`backdrop-blur-sm` on multiple simultaneous cards (up to 9 on the `/projects` page) is well within modern GPU compositing limits. Tested pattern from the header.

3D `translateZ` and `perspective` are GPU-accelerated. No layout thrashing.

---

## Files Changed

| File | Phase | Change |
|---|---|---|
| `src/components/project/project-card.tsx` | 1, 2, 4 | 3D depth layers, glow border, suit scatter, corner markers, first-hover sound, glassmorphism, `.card-shine` class |
| `src/components/project/project-filter.tsx` | 3 | `AnimatePresence`, layout animation, dealt entry |
| `src/components/sections/project-grid.tsx` | 3 | Update cardVariant to dealing animation |
| `src/components/sections/featured-projects.tsx` | 3 | (Uses ProjectGrid — gets dealing animation for free) |
| `src/app/globals.css` | — | No new CSS needed (`.card-shine` already exists) |

---

## Implementation Order

| Step | Phase | Description | Est. Time |
|---|---|---|---|
| 1 | 1 | Apply `translateZ` to all card children | 30 min |
| 2 | 1 | Tilt-driven dynamic glow border | 20 min |
| 3 | 1 | Suit scatter in image area (+ deterministic seed utility) | 45 min |
| 4 | 1 | Add `card-shine` class | 5 min |
| 5 | 1 | Glassmorphism surface (`bg-white/70 backdrop-blur-sm`) | 10 min |
| 6 | 2 | Suit-based category badge + corner markers | 30 min |
| 7 | 2 | First-hover sound via existing `playReelTick` | 15 min |
| 8 | 3 | Dealt entry animation (update `cardVariant`) | 20 min |
| 9 | 3 | Filter animation with `AnimatePresence` | 30 min |
| 10 | 4 | Reduced-motion guards + hover debounce check | 15 min |
| | | **Total** | **~4 hours** |

---

## How It Connects to What Exists

| Existing System | How Cards Use It |
|---|---|
| `♠♣♥♦` symbols in casino intro + loading | Phase 1.3 suit scatter in image area |
| `--color-gold` / `--color-gold-dark` in globals.css | Phase 2.1 category badge gold gradient |
| Web Audio `playReelTick(intensity)` in casino-provider | Phase 2.3 first-hover tick sound |
| `useCasino()` / `playKey` already in ProjectCard | Phase 2.3 reuses existing hook |
| `.card-shine` CSS in globals.css (defined, unused) | Phase 1.4 finally applied |
| Header glass navbar (`bg-white/80 backdrop-blur-md`) | Phase 1.5 card surface treated identically |
| Scroll-intensity → sound hard/hit paradigm | Phase 1.2 tilt-intensity → glow border (same feedback principle) |
| Section alternating gradient backgrounds | Phase 1.5 glass card reveals gradient below |
