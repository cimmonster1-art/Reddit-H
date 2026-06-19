// The daily payoff is a *story*, never a score delta. This builds the poetic
// digest lines and growth prompt from the classified buckets. Tomorrow's post
// must read like "the moon now has teeth," not "post volume +12%."

import type { WorldState, GrowthOption, Organ } from '../shared/types.js';
import { GROWTH_BLURB, GROWTH_LABEL } from '../shared/vocab.js';
import { mulberry32 } from './rng.js';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

/** Builds 3–5 lines describing what the organism became overnight. */
export function buildDigest(prev: WorldState | null, next: WorldState): string[] {
  const lines: string[] = [];
  const m = next.metabolism;

  lines.push(`The organism breathed ${fmt(m.breaths)} times overnight.`);

  const richest = topBy(next.organs, (o) => o.oxygen);
  if (richest) lines.push(`Oxygen pooled around the ${biomeName(next, richest)}.`);

  const storm = next.storms[0];
  if (storm) {
    lines.push(`A ${storm.intensity > 0.6 ? 'low-oxygen' : 'rising'} argument storm is forming where "${shorten(storm.title)}" burns.`);
  }

  const fruited = next.organs.filter((o) => o.state === 'sun-organ').length;
  if (fruited > 0) {
    lines.push(`${fruited} ${fruited === 1 ? 'comment' : 'comments'} fruited under high lift pressure.`);
  }

  if (prev && next.fossils.length > prev.fossils.length) {
    lines.push(`One organ fossilized into memory.`);
  }

  const newSpecies = next.species.find((s) => !prev?.species.some((p) => p.id === s.id));
  if (newSpecies) {
    lines.push(`A new species stirs in the canopy — for now we only know it as "${newSpecies.keyword}."`);
  }

  if (next.growth.resolvedYesterday) {
    lines.push(`Yesterday the community chose to ${next.growth.resolvedYesterday.label.toLowerCase()}. It is visible now.`);
  }

  return lines.slice(0, 5);
}

/** The daily growth ritual: choices grounded in the organism's actual state. */
export function buildGrowth(world: WorldState): { prompt: string; options: GrowthOption[] } {
  const rnd = mulberry32(world.seed + world.day);
  const options: GrowthOption[] = [];

  const quiet = topBy(world.organs.filter((o) => o.state === 'breathing-seed'), (o) => o.lift);
  options.push(opt('ventilate', quiet?.id));

  const region = world.biomes[0];
  options.push(opt('perfuse', region?.id));

  const inflamed = topBy(world.organs, (o) => o.inflammation);
  if (inflamed && inflamed.inflammation > 0.2) options.push(opt('prune', inflamed.id));

  const seedling = topBy(world.organs.filter((o) => o.state === 'dormant-seed'), (o) => o.nerves);
  options.push(opt('incubate', seedling?.id));

  options.push(opt('bloom', region?.id));

  // Keep it to a tight, legible set of choices.
  const trimmed = shuffle(options, rnd).slice(0, 4);
  return {
    prompt: 'What should the organism grow tonight?',
    options: trimmed,
  };
}

function opt(choice: GrowthOption['choice'], targetId?: string): GrowthOption {
  return { choice, label: GROWTH_LABEL[choice], blurb: GROWTH_BLURB[choice], targetId, votes: 0 };
}

function topBy<T>(items: T[], score: (t: T) => number): T | undefined {
  let best: T | undefined;
  let bestS = -Infinity;
  for (const it of items) {
    const s = score(it);
    if (s > bestS) {
      bestS = s;
      best = it;
    }
  }
  return best;
}

function biomeName(world: WorldState, organ: Organ): string {
  const b = world.biomes.find((x) => x.label === organ.flair);
  return b ? `${b.label} Reef` : 'open canopy';
}

function shorten(s: string, n = 42): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
