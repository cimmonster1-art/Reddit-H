// Live explorer presence. Each viewer beats a heartbeat into a per-subreddit
// sorted set (score = last-seen epoch ms); anyone seen inside the recent window
// is "here now". We hand the client only an anonymous, deterministic seed per
// other explorer — never a user id or name — so the cosmos can render them as
// drifting light-traces without exposing who they are.

import { redis } from '@devvit/web/server';
import type { ExplorerTrace, PresenceResponse } from '../shared/types.js';

const WINDOW_MS = 90_000; // counted as present if seen in the last 90s
const MAX_TRACES = 16; // cap rendered traces; presence count is uncapped

const key = (sr: string) => `substrate:${sr}:presence`;

/** Record this user's heartbeat and return everyone else currently present. */
export async function heartbeat(
  sr: string,
  user: string,
  now: number
): Promise<PresenceResponse> {
  const k = key(sr);
  await redis.zAdd(k, { member: user, score: now });
  // Evict anyone who fell out of the window so the set stays small.
  await redis.zRemRangeByScore(k, 0, now - WINDOW_MS);

  const live = await redis.zRange(k, now - WINDOW_MS, '+inf', { by: 'score' });
  const others = live.filter((m) => m.member !== user);
  const explorers: ExplorerTrace[] = others
    .slice(0, MAX_TRACES)
    .map((m) => ({ seed: seedOf(m.member) }));

  return { explorers, total: live.length };
}

/** Stable 0..1 hash of a user id — drives a trace's path without revealing it. */
function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return (h >>> 0) / 0xffffffff;
}
