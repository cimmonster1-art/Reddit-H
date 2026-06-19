// Reads one thread's real comments/replies through the Devvit Reddit API and
// transforms them into the strict CommentNode / ReplyBranch domain models the
// client renders as orbiting moons and satellites. Called on demand when a user
// dives into a thread-star, so counts are capped to stay cheap and safe.

import { reddit } from '@devvit/web/server';
import type { CommentNode, ReplyBranch, ThreadResponse } from '../shared/types.js';

const MAX_COMMENTS = 24; // moons orbiting the thread-star
const MAX_REPLIES = 6; //   satellites per moon
const EXCERPT = 160; //      characters of literal text we surface

function excerpt(body: string): string {
  const s = body.replace(/\s+/g, ' ').trim();
  return s.length > EXCERPT ? `${s.slice(0, EXCERPT - 1)}…` : s;
}

function ageHours(created: Date, now: number): number {
  return Math.max(0, (now - created.getTime()) / 3_600_000);
}

interface CommentLike {
  id: string;
  authorName: string;
  body: string;
  score: number;
  createdAt: Date;
  parentId: string;
  replies: { all: () => Promise<CommentLike[]> };
}

function toReply(c: CommentLike, now: number): ReplyBranch {
  return { id: c.id, author: c.authorName, excerpt: excerpt(c.body), score: c.score, ageHours: ageHours(c.createdAt, now) };
}

/** Pulls the top comments for a post and a shallow layer of their replies. */
export async function readThread(postId: string): Promise<ThreadResponse> {
  const now = Date.now();
  const listing = reddit.getComments({
    postId: postId as `t3_${string}`,
    limit: MAX_COMMENTS,
    depth: 2,
    sort: 'top',
  });
  const top = (await listing.all()) as unknown as CommentLike[];

  const comments: CommentNode[] = [];
  for (const c of top) {
    // Only top-level comments seed moons; nested ones ride as satellites.
    if (!c.parentId.startsWith('t3_')) continue;
    let replies: ReplyBranch[] = [];
    try {
      const kids = await c.replies.all();
      replies = kids.slice(0, MAX_REPLIES).map((k) => toReply(k, now));
    } catch {
      replies = [];
    }
    comments.push({
      id: c.id,
      author: c.authorName,
      excerpt: excerpt(c.body),
      score: c.score,
      replyCount: replies.length,
      ageHours: ageHours(c.createdAt, now),
      replies,
    });
    if (comments.length >= MAX_COMMENTS) break;
  }

  return { threadId: postId, comments };
}
