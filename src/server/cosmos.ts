// Samples live activity for the foundational galaxies so the cosmos pulses to
// real Reddit. For each subreddit we read the day's top posts (a cheap, bounded
// listing) and fold score + comments + post-count into one normalised activity
// number. The whole set is cached briefly in Redis so a burst of viewers shares
// a single read rather than hammering the API. Called from POST /api/cosmos.

import { reddit, redis } from '@devvit/web/server';
import type { CosmosResponse, GalaxyPulse } from '../shared/types.js';

const SAMPLE = 10; //        top posts read per subreddit
const MAX_SUBS = 12; //      hard cap on galaxies sampled per request
const TTL_SECONDS = 600; //  10-minute cache — live enough, kind to rate limits

interface PostLike { score: number; numberOfComments: number }

function cacheKey(subs: string[]): string {
  return `substrate:cosmos:${[...subs].sort().join(',')}`;
}

async function sampleOne(sub: string): Promise<Omit<GalaxyPulse, 'activity'>> {
  try {
    const listing = reddit.getTopPosts({ subredditName: sub, timeframe: 'day', limit: SAMPLE });
    const posts = (await listing.all()) as unknown as PostLike[];
    let score = 0, comments = 0;
    for (const p of posts) { score += p.score ?? 0; comments += p.numberOfComments ?? 0; }
    return { sub: sub.toLowerCase(), score, comments, posts: posts.length };
  } catch {
    return { sub: sub.toLowerCase(), score: 0, comments: 0, posts: 0 };
  }
}

/** Read (or serve cached) live activity for the given foundational subreddits. */
export async function readCosmos(subs: string[]): Promise<CosmosResponse> {
  const list = subs.slice(0, MAX_SUBS).filter(Boolean);
  if (list.length === 0) return { galaxies: [], sampledAt: Date.now() };

  const key = cacheKey(list);
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as CosmosResponse;

  const raw = await Promise.all(list.map(sampleOne));

  // A combined energy per galaxy, then normalise to 0..1 across the set so the
  // brightest community reads as ~1 and the quietest still breathes.
  const energy = raw.map((r) => r.score + r.comments * 2 + r.posts * 40);
  const max = Math.max(1, ...energy);
  const galaxies: GalaxyPulse[] = raw.map((r, i) => ({
    ...r,
    activity: Math.max(0.12, Math.min(1, energy[i] / max)),
  }));

  const out: CosmosResponse = { galaxies, sampledAt: Date.now() };
  try {
    await redis.set(key, JSON.stringify(out));
    await redis.expire(key, TTL_SECONDS);
  } catch {
    // Cache is best-effort; a failure here just means the next view re-samples.
  }
  return out;
}
