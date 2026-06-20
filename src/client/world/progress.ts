// Milestone definitions: each maps one pitch clause to its implementation status.
// The Hud reads this to render the BUILD STATUS bar in the left panel.
// 'done' = shipped + building; 'partial' = scaffold/stub live; 'planned' = next.

export type MilestoneState = 'done' | 'partial' | 'planned';

export interface Milestone {
  id: string;
  label: string;
  detail: string;
  state: MilestoneState;
  phase: number;
}

export const MILESTONES: Milestone[] = [
  // Phase 1 — the living canvas
  { phase: 1, id: 'renderer',   state: 'done',    label: 'Cold rendered cosmos',      detail: 'Three.js PBR · ACES tone · bloom · vignette' },
  { phase: 1, id: 'planet',     state: 'done',    label: 'Planet organism',           detail: 'PBR core · Fresnel membrane · vascular wireframe' },
  { phase: 1, id: 'biomes',     state: 'done',    label: 'Subreddits as galaxies',    detail: 'Spiral halos · cosmic web · floating labels' },
  { phase: 1, id: 'threads',    state: 'done',    label: 'Posts as stars',            detail: 'Vital-state colour · lift → mass · title labels' },
  { phase: 1, id: 'zoom',       state: 'done',    label: 'Infinitely zoomable',       detail: 'COSMOS → GALAXY → STAR → ORBIT → MOON' },
  { phase: 1, id: 'ui',         state: 'done',    label: 'Concept-matched UI',        detail: 'Left stats · right inspector · breadcrumb counts' },

  // Phase 2 — real Reddit data at depth
  { phase: 2, id: 'comments',   state: 'done',    label: 'Comments as moon-orbit',    detail: 'Live /api/thread · golden-angle distribution' },
  { phase: 2, id: 'replies',    state: 'done',    label: 'Replies as satellites',     detail: 'Score → fuel · recency → drift speed' },
  { phase: 2, id: 'digest',     state: 'done',    label: 'Nightly world digest',      detail: 'Scheduled 08:00 UTC · metabolises overnight data' },
  { phase: 2, id: 'actions',    state: 'done',    label: 'Daily community action',    detail: 'vote / ventilate / perfuse / prune / incubate / bloom' },
  { phase: 2, id: 'live-pulse', state: 'done',    label: 'Live galaxy pulse',         detail: 'Cached /api/cosmos · activity → glow, pulse, spin, airflow' },

  // Phase 3 — depth + lore
  { phase: 3, id: 'fossils',    state: 'done',    label: 'Fossil monuments',          detail: 'Iconic old posts crystallised in the planet crust' },
  { phase: 3, id: 'storms',     state: 'done',    label: 'Storm visualisation',       detail: 'Controversial threads as atmospheric disturbances' },
  { phase: 3, id: 'species',    state: 'done',    label: 'Keyword creatures',         detail: 'Recurring motifs evolve into named species' },
  { phase: 3, id: 'moon-cycle', state: 'done',    label: 'Moon lifecycle',            detail: 'ASLEEP → CRACKED → GLOWING → HATCHED per comment' },
  { phase: 3, id: 'atlas',      state: 'done',    label: 'Community atlas log',       detail: 'Append-only mythology: blooms, storms, named species' },

  // Phase 4 — polish + hackathon submission
  { phase: 4, id: 'bloom-post', state: 'done',    label: 'Today\'s Bloom post',      detail: 'Nightly digest auto-creates a living update post' },
  { phase: 4, id: 'presence',   state: 'partial', label: 'Explorer presence',        detail: 'Other users visible as moving light-traces' },
  { phase: 4, id: 'playtest',   state: 'partial', label: 'Live playtest',            detail: 'r/substratelab · substrataaa Devvit identity wired' },
  { phase: 4, id: 'submit',     state: 'partial', label: 'Hackathon submission',     detail: 'Games with a Hook · polished · paint-tested' },
];

export function progressSummary(): { done: number; partial: number; total: number; pct: number } {
  const done    = MILESTONES.filter((m) => m.state === 'done').length;
  const partial = MILESTONES.filter((m) => m.state === 'partial').length;
  const total   = MILESTONES.length;
  const pct     = Math.round((done + partial * 0.5) / total * 100);
  return { done, partial, total, pct };
}

export function currentPhase(): number {
  const inProgress = MILESTONES.filter((m) => m.state !== 'done');
  return inProgress.length ? inProgress[0].phase : 4;
}
