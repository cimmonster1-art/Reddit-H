// Builds and evolves the authoritative WorldState. The nightly digest calls
// `evolve` with fresh classified data plus yesterday's winning vote; the result
// is the world every viewer sees tomorrow.

import type {
  WorldState,
  Storm,
  Fossil,
  GrowthChoice,
  AtlasEntry,
} from '../shared/types.js';
import type { RawPost } from './classify.js';
import { classify } from './classify.js';
import { buildDigest, buildGrowth } from './copy.js';
import { hashStr, mulberry32 } from './rng.js';

const MS_DAY = 86_400_000;

function moonFor(world: Pick<WorldState, 'metabolism'>): WorldState['moon'] {
  const n = world.metabolism.nerves;
  if (n > 4000) return 'hatched';
  if (n > 1500) return 'glowing';
  if (n > 400) return 'cracked';
  return 'asleep';
}

function rareEvent(seed: number, day: number): WorldState['weather']['event'] {
  // A weekly-ish rare event to spike return. Deterministic per day.
  const r = mulberry32(seed + day * 7919)();
  if (day % 7 === 0) return 'aurora';
  if (r > 0.92) return 'meteor';
  if (r < 0.06) return 'eclipse';
  return undefined;
}

export function freshWorld(subreddit: string): WorldState {
  const seed = hashStr(subreddit);
  return {
    subreddit,
    day: 0,
    seed,
    updatedAt: Date.now(),
    metabolism: { oxygen: 0, bloodflow: 0, nerves: 0, breaths: 0 },
    biomes: [],
    organs: [],
    species: [],
    fossils: [],
    storms: [],
    moon: 'asleep',
    weather: { pulse: 0.4 },
    digest: ['A dormant spore drifts in orbit, waiting for the first day of weather.'],
    growth: { prompt: 'What should the organism grow tonight?', options: [] },
    atlas: [],
  };
}

export interface EvolveInput {
  prev: WorldState | null;
  subreddit: string;
  recentPosts: RawPost[];
  /** all-time iconic posts to embed as fossils (seeds an empty world too). */
  iconicPosts: RawPost[];
  /** the growth choice the community voted for yesterday, if any. */
  appliedChoice?: GrowthChoice;
  now: number;
}

export function evolve(input: EvolveInput): WorldState {
  const { prev, subreddit, recentPosts, iconicPosts, appliedChoice, now } = input;
  const seed = prev?.seed ?? hashStr(subreddit);
  const day = (prev?.day ?? 0) + 1;

  const { organs, biomes, species, metabolism } = classify(recentPosts, now, seed + day);

  // Storms hang over the most inflamed organs.
  const storms: Storm[] = organs
    .filter((o) => o.inflammation > 0.35 && o.nerves > 8)
    .sort((a, b) => b.inflammation - a.inflammation)
    .slice(0, 3)
    .map((o) => ({ id: `storm-${o.id}`, title: o.title, intensity: o.inflammation, organ: o.id }));

  // Carry species names forward across days (community canonization persists).
  if (prev) {
    for (const s of species) {
      const old = prev.species.find((p) => p.id === s.id);
      if (old?.named) {
        s.named = true;
        s.name = old.name;
      }
    }
  }

  // Fossils: keep prior fossils, and promote a new iconic post each day.
  const fossils: Fossil[] = [...(prev?.fossils ?? [])];
  const fossilIds = new Set(fossils.map((f) => f.id));
  for (const p of [...iconicPosts].sort((a, b) => b.score - a.score)) {
    if (fossilIds.has(p.id)) continue;
    fossils.push({ id: p.id, title: p.title, permalink: p.permalink, lift: p.score, preservedDay: day });
    break; // at most one new fossil per night
  }

  const world: WorldState = {
    subreddit,
    day,
    seed,
    updatedAt: now,
    metabolism,
    biomes,
    organs,
    species,
    fossils,
    storms,
    moon: 'asleep',
    weather: { pulse: pulseFrom(metabolism), event: rareEvent(seed, day) },
    digest: [],
    growth: { prompt: '', options: [] },
    atlas: nextAtlas(prev, day, { storms, fossils, species, appliedChoice }),
  };
  world.moon = moonFor(world);

  applyChoice(world, appliedChoice);

  world.digest = buildDigest(prev, world);
  const growth = buildGrowth(world);
  world.growth = {
    prompt: growth.prompt,
    options: growth.options,
    resolvedYesterday: appliedChoice
      ? { choice: appliedChoice, label: labelFor(appliedChoice) }
      : undefined,
  };

  return world;
}

function pulseFrom(m: { nerves: number; bloodflow: number }): number {
  return Math.max(0.25, Math.min(1, (m.nerves + m.bloodflow) / 3000));
}

/** The visible consequence of yesterday's community vote. */
function applyChoice(world: WorldState, choice?: GrowthChoice): void {
  if (!choice) return;
  switch (choice) {
    case 'ventilate': {
      const t = world.organs.find((o) => o.state === 'breathing-seed') ?? world.organs[0];
      if (t) t.oxygen = Math.min(1, t.oxygen + 0.3);
      break;
    }
    case 'perfuse':
      for (const b of world.biomes.slice(0, 1)) b.weight = Math.min(1, b.weight * 1.4);
      break;
    case 'prune': {
      const t = [...world.organs].sort((a, b) => b.inflammation - a.inflammation)[0];
      if (t) t.inflammation = Math.max(0, t.inflammation - 0.5);
      world.storms = world.storms.filter((s) => s.organ !== t?.id);
      break;
    }
    case 'incubate': {
      const t = world.organs.find((o) => o.state === 'dormant-seed');
      if (t) t.oxygen = Math.min(1, t.oxygen + 0.15);
      break;
    }
    case 'bloom':
      world.weather.pulse = Math.min(1, world.weather.pulse + 0.25);
      break;
  }
}

function nextAtlas(
  prev: WorldState | null,
  day: number,
  ctx: { storms: Storm[]; fossils: Fossil[]; species: WorldState['species']; appliedChoice?: GrowthChoice }
): AtlasEntry[] {
  const atlas = [...(prev?.atlas ?? [])];
  const newFossil = ctx.fossils.find((f) => f.preservedDay === day);
  if (newFossil) atlas.push({ day, kind: 'fossil', text: `An iconic organ fossilized into the crust.` });
  if (ctx.storms[0]) atlas.push({ day, kind: 'storm', text: `A storm gathered over the loudest debate.` });
  if (ctx.appliedChoice)
    atlas.push({ day, kind: 'vote', text: `The community chose to ${labelFor(ctx.appliedChoice).toLowerCase()}.` });
  // keep the atlas bounded so storage stays small
  return atlas.slice(-60);
}

function labelFor(choice: GrowthChoice): string {
  return choice.charAt(0).toUpperCase() + choice.slice(1);
}

export function daysSince(epochMs: number): number {
  return Math.floor(epochMs / MS_DAY);
}
