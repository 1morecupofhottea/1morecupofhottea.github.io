/**
 * Pure Web Audio API sound synthesis for the casino easter egg.
 * No audio files — every sound is generated on the fly with oscillators.
 */

/** Descending sine "thunk" simulating a lever pull. 0–100ms, 120Hz → 40Hz. */
function playLeverPull(ctx: AudioContext, startTime: number) {
  const duration = 0.1;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(120, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(40, startTime + duration);

  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/** 4 rapid square-wave ticks with falling pitch, simulating clicking reels. 80–320ms, 800Hz → 560Hz. */
function playReelClicks(ctx: AudioContext, startTime: number) {
  const tickCount = 4;
  const tickDuration = 0.06;
  const spacing = (0.32 - 0.08) / tickCount;
  const startFreq = 800;
  const endFreq = 560;

  for (let i = 0; i < tickCount; i++) {
    const tickStart = startTime + 0.08 + i * spacing;
    const frequency = startFreq + (endFreq - startFreq) * (i / (tickCount - 1));

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, tickStart);

    gain.gain.setValueAtTime(0.15, tickStart);
    gain.gain.exponentialRampToValueAtTime(0.001, tickStart + tickDuration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(tickStart);
    oscillator.stop(tickStart + tickDuration);
  }
}

/**
 * Plays the two-phase lever/reels sound: a descending thunk followed by
 * four clicking ticks with falling pitch, evoking a slot-machine pull.
 */
export function playLeverSound(ctx: AudioContext) {
  const startTime = ctx.currentTime;
  playLeverPull(ctx, startTime);
  playReelClicks(ctx, startTime);
}

/**
 * Single short tick (~40ms, 900Hz by default) used both for `ReelReveal`'s
 * settle-completion moment and — repeatedly, at a throttled cadence — while
 * a reel is actively "spinning" during a scroll. Quiet/high-pitched by
 * default since many instances can tick in quick succession.
 *
 * `intensity` (0–1, driven by current scroll speed) scales the tick toward
 * a louder, lower, slightly longer "thud" — so ticking during a hard/fast
 * scroll hits noticeably harder than a light scroll or resting settle.
 */
export function playReelSettleTick(ctx: AudioContext, intensity = 0) {
  const startTime = ctx.currentTime;
  const clamped = Math.max(0, Math.min(intensity, 1));

  const duration = 0.04 + clamped * 0.05; // 40ms → up to 90ms
  const frequency = 900 - clamped * 500; // 900Hz → down to 400Hz
  const peakGain = 0.05 + clamped * 0.25; // 0.05 → up to 0.3

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (clamped > 0) {
    // Harder hits get a touch of downward pitch bend for extra "thump".
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(frequency * 0.6, 40),
      startTime + duration
    );
  }

  gain.gain.setValueAtTime(peakGain, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}
