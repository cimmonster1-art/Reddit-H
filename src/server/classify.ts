// Turns raw subreddit signals into organism structure. Deliberately simple and
// robust: counts, ratios, score buckets, flair grouping and a stopword-filtered
// keyword map. No LLM required — the metaphor does the heavy lifting.

import type {
  Biome,
  Organ,
  Species,
  VitalState,
  Metabolism,
} from '../shared/types.js';
import { mulberry32, hashStr } from './rng.js';

/** A flattened post as read from the Reddit API (only the fields we need). */
export interface RawPost {
  id: string;
  title: string;
  permalink: string;
  flair?: string;
  createdAtMs: number;
  score: number; // net upvotes
  comments: number; // comment count (proxy for nerve activity)
  upvoteRatio: number; // 0..1; low ratio on a busy thread => controversy
  views?: number; // may be undefined; we estimate when missing
  crossposts?: number;
}

const STOPWORDS = new Set(
  ('a an the of to and or but in on at for with from this that these those is are was were be been ' +
    'it its as by we you they i me my your our their he she his her them so if then than too very ' +
    'can will just dont cant im not no yes do does did has have had what when where who why how get ' +
    'got new like one all any out up off about into over more most some such only own same other')
    .split(' ')
);

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Views are rarely available per-post via the API. When missing we estimate
 * oxygen from engagement so the atmosphere layer always has something to draw:
 * a busy thread breathed more than a silent one.
 */
function estimateOxygen(p: RawPost): number {
  if (typeof p.views === 'number' && p.views > 0) return p.views;
  return Math.round(p.score * 9 + p.comments * 14 + 30);
}

function vitalState(p: RawPost, maxOxygen: number, maxNerves: number): VitalState {
  const oxygen = estimateOxygen(p) / Math.max(1, maxOxygen);
  const nerves = p.comments / Math.max(1, maxNerves);
  const controversy = p.comments > 8 ? 1 - p.upvoteRatio : 0;
  const lift = p.score;

  if ((p.crossposts ?? 0) >= 3) return 'spore-gate';
  if (controversy > 0.28 && nerves > 0.4 && oxygen > 0.3) return 'storm-organ';
  if (oxygen > 0.55 && lift > 40) return 'sun-organ';
  if (nerves > 0.5 && oxygen < 0.5) return 'nerve-bloom';
  if (oxygen > 0.5 && nerves < 0.25) return 'breathing-seed';
  return 'dormant-seed';
}

/** Stable, even-ish placement on the unit sphere via a golden-spiral, jittered by seed. */
function placeOnSphere(index: number, total: number, seed: number): { u: number; v: number } {
  const rnd = mulberry32(seed + index * 2654435761);
  const golden = 0.6180339887498949;
  const u = (index * golden + rnd() * 0.04) % 1;
  const v = clamp01((index + 0.5) / Math.max(1, total) + (rnd() - 0.5) * 0.04);
  return { u, v };
}

export interface Classified {
  organs: Organ[];
  biomes: Biome[];
  species: Species[];
  metabolism: Metabolism;
}

export function classify(posts: RawPost[], now: number, seed: number): Classified {
  const maxOxygen = Math.max(1, ...posts.map(estimateOxygen));
  const maxNerves = Math.max(1, ...posts.map((p) => p.comments));

  const organs: Organ[] = posts.map((p, i) => {
    const ageHours = Math.max(0, (now - p.createdAtMs) / 3_600_000);
    const oxygen = clamp01(estimateOxygen(p) / maxOxygen);
    const inflammation = p.comments > 8 ? clamp01((1 - p.upvoteRatio) * 1.8) : 0;
    const { u, v } = placeOnSphere(i, posts.length, seed);
    return {
      id: p.id,
      title: p.title,
      permalink: p.permalink,
      flair: p.flair,
      ageHours,
      lift: p.score,
      nerves: p.comments,
      oxygen,
      spores: p.crossposts ?? 0,
      inflammation,
      state: vitalState(p, maxOxygen, maxNerves),
      u,
      v,
    };
  });

  // Flairs -> biomes (regions / tissue types).
  const byFlair = new Map<string, RawPost[]>();
  for (const p of posts) {
    const key = (p.flair ?? '').trim() || 'Unflaired';
    (byFlair.get(key) ?? byFlair.set(key, []).get(key)!).push(p);
  }
  const totalActivity = Math.max(1, posts.reduce((s, p) => s + p.score + p.comments + 1, 0));
  const biomes: Biome[] = [...byFlair.entries()]
    .map(([label, group]) => {
      const activity = group.reduce((s, p) => s + p.score + p.comments + 1, 0);
      return {
        id: slug(label),
        label,
        hue: hashStr(label) % 360,
        weight: clamp01(activity / totalActivity),
        organCount: group.length,
      };
    })
    .sort((a, b) => b.weight - a.weight);

  // Recurring keyword clusters -> species.
  const freq = new Map<string, number>();
  for (const p of posts) {
    const seen = new Set<string>();
    for (const w of tokenize(p.title)) {
      if (seen.has(w)) continue;
      seen.add(w);
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  const species: Species[] = [...freq.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([keyword, population]) => ({
      id: slug(keyword),
      name: keyword,
      keyword,
      population,
      named: false,
    }));

  const metabolism: Metabolism = {
    oxygen: posts.reduce((s, p) => s + estimateOxygen(p), 0),
    bloodflow: posts.reduce((s, p) => s + Math.max(0, p.score), 0),
    nerves: posts.reduce((s, p) => s + p.comments, 0),
    breaths: posts.reduce((s, p) => s + estimateOxygen(p), 0),
  };

  return { organs, biomes, species, metabolism };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';
}
