// One sacred rule of identity: we never speak analytics. Every number the
// organism exposes is wrapped in biological / cyberpunk language. This file is
// the single source of truth for that vocabulary so client and server agree.

import type { GrowthChoice, VitalState, DailyAction } from './types.js';

export const TERMS = {
  posts: 'organs',
  comments: 'signal spores',
  replies: 'threadroots',
  upvotes: 'lift current',
  views: 'oxygen',
  shares: 'spores',
  controversy: 'inflammation',
  trending: 'emergent species',
  archive: 'fossil layer',
  poll: 'growth ritual',
} as const;

export const VITAL_LABEL: Record<VitalState, string> = {
  'dormant-seed': 'Dormant Seed',
  'breathing-seed': 'Breathing Seed',
  'nerve-bloom': 'Nerve Bloom',
  'sun-organ': 'Sun Organ',
  'storm-organ': 'Storm Organ',
  'fossil-core': 'Fossil Core',
  'spore-gate': 'Spore Gate',
};

export const VITAL_BLURB: Record<VitalState, string> = {
  'dormant-seed': 'Quiet on every channel. Waiting for attention to find it.',
  'breathing-seed': 'Oxygen-rich but neurologically quiet — seen, not yet discussed.',
  'nerve-bloom': 'Dense nerve activity in a low-oxygen pocket. A real conversation.',
  'sun-organ': 'Oxygenated and electrified. The community is lifting this one.',
  'storm-organ': 'Oxygen, nerves and inflammation at once. A debate is burning here.',
  'fossil-core': 'An old organ, preserved. The crust remembers it.',
  'spore-gate': 'Casting spores outward — this organ is reproducing across spaces.',
};

export const GROWTH_LABEL: Record<GrowthChoice, string> = {
  ventilate: 'Ventilate',
  perfuse: 'Perfuse',
  prune: 'Prune',
  incubate: 'Incubate',
  bloom: 'Bloom',
};

export const GROWTH_BLURB: Record<GrowthChoice, string> = {
  ventilate: 'Breathe oxygen into an unseen but worthy thread.',
  perfuse: 'Feed views and lift together to grow a whole region.',
  prune: 'Pull oxygen from inflamed, spammy tissue and let it calm.',
  incubate: 'Shelter a quiet, promising seed so it survives the night.',
  bloom: 'Spend stored oxygen to expand a biome you can watch unfold.',
};

export const ACTION_LABEL: Record<DailyAction, string> = {
  explore: 'Explore',
  nurture: 'Nurture',
  stabilize: 'Stabilize',
  seed: 'Seed',
  name: 'Name',
};

// Curated, abuse-proof contribution palette. The only "free expression" the
// organism accepts is choosing one of these — never raw text rendered in-world.
export const SEED_SYMBOLS = ['✦', '❀', '☼', '⟡', '♁', '✸', '❖', '✺', '✣', '⌖'] as const;

// Discoverer titles — identity without sweaty RPG stats.
export const TITLES = {
  firstExplorer: 'First Explorer',
  doorOpener: 'Door Opener',
  cartographer: 'Cartographer',
  stormcaller: 'Stormcaller',
  namegiver: 'Namegiver',
  tender: 'Tender of the Substrate',
} as const;
