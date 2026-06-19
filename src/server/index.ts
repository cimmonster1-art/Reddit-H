// Devvit Web server. Hosts the JSON API the webview calls, plus the internal
// endpoints Devvit invokes for the nightly scheduler, the moderator menu action
// and the install trigger.

import express, { type Request, type Response } from 'express';
import {
  createServer,
  getServerPort,
  context,
  reddit,
} from '@devvit/web/server';

import type {
  ActionRequest,
  InitResponse,
  MutationResponse,
  VoteRequest,
  WorldState,
} from '../shared/types.js';
import { TITLES } from '../shared/vocab.js';
import { readSubreddit } from './digest.js';
import { evolve, freshWorld } from './world.js';
import {
  awardTitle,
  bumpStreak,
  getStreak,
  getTitles,
  hasActedToday,
  hasVotedToday,
  loadWorld,
  recordAction,
  recordVote,
  saveWorld,
  winningChoice,
} from './storage.js';

const app = express();
app.use(express.json());

function subredditName(): string {
  return context.subredditName ?? 'unknown';
}
function userId(): string {
  return context.userId ?? 'anon';
}
function todayIndex(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/** Ensure a world exists; seed an empty one from all-time icons on first touch. */
async function ensureWorld(sr: string): Promise<WorldState> {
  const existing = await loadWorld(sr);
  if (existing) return existing;
  const { recentPosts, iconicPosts } = await readSubreddit(sr).catch(() => ({
    recentPosts: [],
    iconicPosts: [],
  }));
  const world = evolve({
    prev: freshWorld(sr),
    subreddit: sr,
    recentPosts,
    iconicPosts,
    now: Date.now(),
  });
  await saveWorld(sr, world);
  return world;
}

// ---------------------------------------------------------------------------
// Public API (called by the webview)
// ---------------------------------------------------------------------------

app.get('/api/init', async (_req: Request, res: Response) => {
  const sr = subredditName();
  const user = userId();
  const world = await ensureWorld(sr);
  const streak = await getStreak(sr, user);
  const me: InitResponse['me'] = {
    actedToday: await hasActedToday(sr, world.day, user),
    votedToday: await hasVotedToday(sr, world.day, user),
    streak,
    titles: await getTitles(sr, user),
  };
  res.json({ world, me } satisfies InitResponse);
});

app.post('/api/action', async (req: Request, res: Response) => {
  const sr = subredditName();
  const user = userId();
  const world = await ensureWorld(sr);
  const body = req.body as ActionRequest;

  if (await hasActedToday(sr, world.day, user)) {
    res.json({ ok: false, message: 'You have already tended the organism today. Return tomorrow.' } satisfies MutationResponse);
    return;
  }

  await recordAction(sr, world.day, user, body.action);
  const streak = await bumpStreak(sr, user, todayIndex());

  // Lightweight, immediately-visible feedback. The structural mutation happens
  // overnight; this is the tactile "I touched it" beat.
  let message = 'The substrate registers your touch.';
  const titles = await getTitles(sr, user);
  switch (body.action) {
    case 'explore':
      message = 'A hidden hotspot flickers into view.';
      titles.includes(TITLES.cartographer) || (await awardTitle(sr, user, TITLES.firstExplorer));
      break;
    case 'nurture':
      message = 'You feed the region. It will be thicker by morning.';
      break;
    case 'stabilize':
      message = 'You calm the storm. The inflammation eases.';
      await awardTitle(sr, user, TITLES.stormcaller);
      break;
    case 'seed':
      message = 'Your spore drifts down into the canopy.';
      break;
    case 'name':
      message = 'Your name joins the candidates. The community will decide.';
      await awardTitle(sr, user, TITLES.namegiver);
      break;
  }

  const me: InitResponse['me'] = {
    actedToday: true,
    votedToday: await hasVotedToday(sr, world.day, user),
    streak,
    titles: await getTitles(sr, user),
  };
  res.json({ ok: true, message, world, me } satisfies MutationResponse);
});

app.post('/api/vote', async (req: Request, res: Response) => {
  const sr = subredditName();
  const user = userId();
  const world = await ensureWorld(sr);
  const body = req.body as VoteRequest;

  if (await hasVotedToday(sr, world.day, user)) {
    res.json({ ok: false, message: 'Your voice is already counted in tonight’s ritual.' } satisfies MutationResponse);
    return;
  }
  if (!world.growth.options.some((o) => o.choice === body.choice)) {
    res.json({ ok: false, message: 'That growth path is not on the table tonight.' } satisfies MutationResponse);
    return;
  }

  const tally = await recordVote(sr, world.day, user, body.choice);
  // Reflect live tallies back into the world copy we hand to this client.
  for (const opt of world.growth.options) opt.votes = Number(tally[opt.choice] ?? 0);
  await saveWorld(sr, world);

  const me: InitResponse['me'] = {
    actedToday: await hasActedToday(sr, world.day, user),
    votedToday: true,
    streak: await getStreak(sr, user),
    titles: await getTitles(sr, user),
  };
  res.json({ ok: true, message: 'The ritual hears you.', world, me } satisfies MutationResponse);
});

// ---------------------------------------------------------------------------
// Internal endpoints (called by Devvit, not the webview)
// ---------------------------------------------------------------------------

app.post('/internal/scheduler/digest', async (_req: Request, res: Response) => {
  const sr = subredditName();
  const prev = await loadWorld(sr);
  const appliedChoice = prev ? await winningChoice(sr, prev.day) : undefined;
  const { recentPosts, iconicPosts } = await readSubreddit(sr);

  const world = evolve({
    prev,
    subreddit: sr,
    recentPosts,
    iconicPosts,
    appliedChoice,
    now: Date.now(),
  });
  await saveWorld(sr, world);
  await postTodaysBloom(sr, world).catch(() => {});
  res.json({ ok: true, day: world.day });
});

app.post('/internal/menu/create-post', async (_req: Request, res: Response) => {
  const sr = subredditName();
  const world = await ensureWorld(sr);
  const post = await reddit.submitCustomPost({
    subredditName: sr,
    title: `Substrate — the living organism of r/${sr}`,
    textFallback: { text: world.digest[0] ?? 'A living world grown from this community.' },
  });
  res.json({ navigateTo: post.url });
});

app.post('/internal/triggers/install', async (_req: Request, res: Response) => {
  const sr = subredditName();
  await ensureWorld(sr);
  res.json({ ok: true });
});

/** Posts the daily "Today's Bloom" so the heartbeat appears in feeds. */
async function postTodaysBloom(sr: string, world: WorldState): Promise<void> {
  await reddit.submitCustomPost({
    subredditName: sr,
    title: `Today’s Bloom — Day ${world.day} of r/${sr}`,
    textFallback: { text: world.digest.slice(0, 2).join(' ') || 'See what grew overnight.' },
  });
}

const server = createServer(app);
server.listen(getServerPort());
