// Reads the host subreddit through the Devvit Reddit API and flattens posts into
// the RawPost shape the classifier expects. Runs once nightly via the scheduler
// (never per-view), so reads stay well within rate limits.

import { reddit } from '@devvit/web/server';
import type { RawPost } from './classify.js';

interface PostLike {
  id: string;
  title: string;
  permalink: string;
  flair?: { text?: string } | undefined;
  createdAt: Date;
  score: number;
  numberOfComments: number;
  numberOfReports?: number;
}

function toRaw(p: PostLike): RawPost {
  // upvoteRatio isn't exposed by the API; approximate inflammation from reports.
  const reports = p.numberOfReports ?? 0;
  const upvoteRatio = Math.max(0.4, 0.95 - reports * 0.06);
  return {
    id: p.id,
    title: p.title,
    permalink: p.permalink,
    flair: p.flair?.text ?? undefined,
    createdAtMs: p.createdAt.getTime(),
    score: p.score,
    comments: p.numberOfComments,
    upvoteRatio,
  };
}

async function collect(listing: { all: () => Promise<PostLike[]> }): Promise<RawPost[]> {
  const items = await listing.all();
  return items.map(toRaw);
}

export interface DigestRead {
  recentPosts: RawPost[];
  iconicPosts: RawPost[];
}

/**
 * Pulls the last day's activity plus a handful of all-time icons. The icons
 * guarantee a brand-new or low-activity subreddit still has fossils to render,
 * so the world is never bare.
 */
export async function readSubreddit(subreddit: string): Promise<DigestRead> {
  const dayAgo = Date.now() - 86_400_000;

  const [newPosts, topAll] = await Promise.all([
    collect(reddit.getNewPosts({ subredditName: subreddit, limit: 60 })),
    collect(reddit.getTopPosts({ subredditName: subreddit, timeframe: 'all', limit: 6 })),
  ]);

  const recentPosts = newPosts.filter((p) => p.createdAtMs >= dayAgo);
  // If the sub is quiet, fall back to the newest posts so the organism still breathes.
  const recent = recentPosts.length >= 3 ? recentPosts : newPosts.slice(0, 24);

  return { recentPosts: recent, iconicPosts: topAll };
}
