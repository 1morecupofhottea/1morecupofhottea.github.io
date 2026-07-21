# Gambling Sound Plan

**Target:** ♠ PLAY button in the header  
**Sound source:** Web Audio API (synthesized, no files)  
**Mute:** Yes — toggle button in header, persisted in localStorage

---

## 3 Changes

### 1. `src/lib/casino-sounds.ts` (new)
Pure Web Audio API utility. Exports `playLeverSound(ctx)` — two-phase synthesized sound:

| Phase | Duration | Sound |
|---|---|---|
| Pull lever | 0–100ms | Descending sine wave thunk (120→40Hz) |
| Reels click | 80–320ms | 4 rapid square-wave ticks with falling pitch (800→560Hz) |

### 2. `src/components/casino/casino-provider.tsx` (extend)
Add to context:

| Field | Detail |
|---|---|
| `muted` | `boolean` — from `localStorage.getItem("casino-muted")` |
| `toggleMute()` | Flips value, persists to localStorage |
| `playLever()` | Lazy `AudioContext` (first call only, respects autoplay policy), plays if not muted |

### 3. `src/components/layout/header.tsx` (edit)
- PLAY button `onClick`: `triggerPlay()` + `playLever()`
- New mute toggle button (Volume2 / VolumeX icons) beside PLAY
- Same in mobile nav
