// Thin typed wrapper over Devvit's Redis-style KV. Keys are namespaced per
// subreddit so one app instance can host many organisms.

import { redis } from '@devvit/web/server';
import type { WorldState, GrowthChoice } from '../shared/types.js';

const k = {
  world: (sr: string) => `substrate:${sr}:world`,
  votes: (sr: string, day: number) => `substrate:${sr}:votes:${day}`,
  userAction: (sr: string, day: number, user: string) => `substrate:${sr}:act:${day}:${user}`,
  userVote: (sr: string, day: number, user: string) => `substrate:${sr}:vote:${day}:${user}`,
  streak: (sr: string, user: string) => `substrate:${sr}:streak:${user}`,
  lastSeen: (sr: string, user: string) => `substrate:${sr}:seen:${user}`,
  titles: (sr: string, user: string) => `substrate:${sr}:titles:${user}`,
};

export async function loadWorld(sr: string): Promise<WorldState | null> {
  const raw = await redis.get(k.world(sr));
  return raw ? (JSON.parse(raw) as WorldState) : null;
}

export async function saveWorld(sr: string, world: WorldState): Promise<void> {
  await redis.set(k.world(sr), JSON.stringify(world));
}

export async function hasActedToday(sr: string, day: number, user: string): Promise<boolean> {
  return (await redis.get(k.userAction(sr, day, user))) != null;
}

export async function recordAction(sr: string, day: number, user: string, action: string): Promise<void> {
  await redis.set(k.userAction(sr, day, user), action);
}

export async function hasVotedToday(sr: string, day: number, user: string): Promise<boolean> {
  return (await redis.get(k.userVote(sr, day, user))) != null;
}

export async function recordVote(
  sr: string,
  day: number,
  user: string,
  choice: GrowthChoice
): Promise<Record<GrowthChoice, number>> {
  await redis.set(k.userVote(sr, day, user), choice);
  await redis.hIncrBy(k.votes(sr, day), choice, 1);
  const raw = (await redis.hGetAll(k.votes(sr, day))) ?? {};
  const out = {} as Record<GrowthChoice, number>;
  for (const [c, n] of Object.entries(raw)) out[c as GrowthChoice] = Number(n);
  return out;
}

export async function voteTally(sr: string, day: number): Promise<Record<string, string>> {
  return (await redis.hGetAll(k.votes(sr, day))) ?? {};
}

/** Returns the winning growth choice for the given day, or undefined if no votes. */
export async function winningChoice(sr: string, day: number): Promise<GrowthChoice | undefined> {
  const tally = await voteTally(sr, day);
  let best: string | undefined;
  let bestN = 0;
  for (const [choice, n] of Object.entries(tally)) {
    const count = Number(n);
    if (count > bestN) {
      bestN = count;
      best = choice;
    }
  }
  return best as GrowthChoice | undefined;
}

/** Updates and returns a user's daily streak. */
export async function bumpStreak(sr: string, user: string, today: number): Promise<number> {
  const last = Number((await redis.get(k.lastSeen(sr, user))) ?? '-1');
  let streak = Number((await redis.get(k.streak(sr, user))) ?? '0');
  if (last === today) return streak; // already counted today
  streak = last === today - 1 ? streak + 1 : 1;
  await redis.set(k.streak(sr, user), String(streak));
  await redis.set(k.lastSeen(sr, user), String(today));
  return streak;
}

export async function getStreak(sr: string, user: string): Promise<number> {
  return Number((await redis.get(k.streak(sr, user))) ?? '0');
}

export async function awardTitle(sr: string, user: string, title: string): Promise<string[]> {
  const raw = (await redis.get(k.titles(sr, user))) ?? '[]';
  const titles: string[] = JSON.parse(raw);
  if (!titles.includes(title)) {
    titles.push(title);
    await redis.set(k.titles(sr, user), JSON.stringify(titles));
  }
  return titles;
}

export async function getTitles(sr: string, user: string): Promise<string[]> {
  return JSON.parse((await redis.get(k.titles(sr, user))) ?? '[]');
}
