// The organism's color language, shared with the CSS variables so the 3D world
// and the glass UI feel like one instrument.

import type { VitalState } from '../../shared/types.js';

export const COLOR = {
  oxygen: 0xaee3ff,
  lift: 0xffb347,
  nerve: 0x7c8cff,
  storm: 0xff5d73,
  spore: 0xb78bff,
  gold: 0xffd98a,
  crust: 0x1a2348,
  void0: 0x05060d,
  void1: 0x0a0d1f,
} as const;

export const VITAL_COLOR: Record<VitalState, number> = {
  'dormant-seed': 0x4a5680,
  'breathing-seed': COLOR.oxygen,
  'nerve-bloom': COLOR.nerve,
  'sun-organ': COLOR.lift,
  'storm-organ': COLOR.storm,
  'fossil-core': COLOR.gold,
  'spore-gate': COLOR.spore,
};

/** hsl helper for biome arcs (hue in degrees). */
export function hsl(hue: number, s = 0.6, l = 0.55): number {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}
