// The contract between the server (which authors the world) and the client
// (which only renders it). The client never invents structure; given the same
// WorldState it always draws the same organism.

/** A vital state classification for a single post-organ. */
export type VitalState =
  | 'dormant-seed' //  low views, low comments, low lift
  | 'breathing-seed' // high views, low comments  (oxygen-rich, quiet)
  | 'nerve-bloom' // high comments, moderate views
  | 'sun-organ' // high views + high lift
  | 'storm-organ' // high views + high comments + controversy
  | 'fossil-core' // old, high-performing, memorialized
  | 'spore-gate'; // high shares / crossposts

/** One post rendered as an organ growing on the organism's surface. */
export interface Organ {
  id: string; // reddit thing id (t3_...)
  title: string; // used only inside the detail card, never drawn in 3D space
  permalink: string;
  flair?: string; // -> biome / tissue type
  ageHours: number; // -> growth stage
  lift: number; // upvotes / score        -> electric blood (brightness, mass)
  nerves: number; // comment+reply count    -> nerve branching complexity
  oxygen: number; // views / attention      -> atmospheric glow (0..1 normalized)
  spores: number; // shares / crossposts    -> reproduction
  inflammation: number; // controversy 0..1  -> red tension storm
  state: VitalState;
  // Deterministic placement on the unit sphere/biome (filled by layout, server side).
  u: number; // 0..1 around
  v: number; // 0..1 latitude
}

/** A flair group becomes an ecological region. */
export interface Biome {
  id: string; // slug of flair (or 'unflaired')
  label: string; // flair text
  hue: number; // 0..360, stable per flair
  weight: number; // share of recent activity (0..1) -> region size
  organCount: number;
}

/** A recurring keyword cluster becomes a species/creature. */
export interface Species {
  id: string;
  name: string; // community-canonized name, or the keyword itself
  keyword: string;
  population: number; // how many posts/comments carried the motif
  named: boolean; // has the community canonized a name?
}

/** An all-time iconic post, embedded in the crust as a monument. */
export interface Fossil {
  id: string;
  title: string;
  permalink: string;
  lift: number;
  preservedDay: number;
}

/** A controversial thread manifesting as an atmospheric storm. */
export interface Storm {
  id: string;
  title: string;
  intensity: number; // 0..1
  organ: string; // organ id it hangs over
}

export type GrowthChoice =
  | 'ventilate' // send oxygen to an underseen but high-quality thread
  | 'perfuse' // combine views + upvotes to grow a region
  | 'prune' // reduce oxygen to spammy / inflamed tissue
  | 'incubate' // preserve a quiet but promising seed
  | 'bloom'; // convert high oxygen into a visible biome expansion

export interface GrowthOption {
  choice: GrowthChoice;
  label: string;
  blurb: string;
  /** id of the world element this option would act on (organ/biome/storm). */
  targetId?: string;
  votes: number;
}

/** Append-only mythology log — the community's shared memory. */
export interface AtlasEntry {
  day: number;
  text: string;
  kind: 'birth' | 'storm' | 'fossil' | 'name' | 'vote' | 'rare';
}

export type MoonState = 'asleep' | 'cracked' | 'glowing' | 'hatched';

export interface Metabolism {
  oxygen: number; // total views overnight
  bloodflow: number; // total upvotes overnight
  nerves: number; // total comments overnight
  breaths: number; // a friendly headline number (views)
}

export interface WorldState {
  subreddit: string;
  day: number; // sequential day index since install
  seed: number; // deterministic RNG seed for layout
  updatedAt: number; // epoch ms
  metabolism: Metabolism;
  biomes: Biome[];
  organs: Organ[];
  species: Species[];
  fossils: Fossil[];
  storms: Storm[];
  moon: MoonState;
  weather: { pulse: number; event?: 'eclipse' | 'meteor' | 'aurora' };
  digest: string[]; // poetic lines describing what changed overnight
  growth: {
    prompt: string;
    options: GrowthOption[];
    resolvedYesterday?: { choice: GrowthChoice; label: string };
  };
  atlas: AtlasEntry[];
}

// ---- API payloads ----

export interface InitResponse {
  world: WorldState;
  me: {
    actedToday: boolean;
    votedToday: boolean;
    streak: number;
    titles: string[];
  };
}

export type DailyAction = 'explore' | 'nurture' | 'stabilize' | 'seed' | 'name';

export interface ActionRequest {
  action: DailyAction;
  targetId?: string;
  payload?: string; // e.g. a chosen symbol or a candidate name id
}

export interface VoteRequest {
  choice: GrowthChoice;
}

export interface MutationResponse {
  ok: boolean;
  message: string;
  world?: WorldState;
  me?: InitResponse['me'];
}

// ---- Thread zoom (comment-orbit) ----

/** A single reply, rendered as a satellite orbiting its comment-moon. */
export interface ReplyBranch {
  id: string;
  author: string;
  excerpt: string; // trimmed, never the full body
  score: number; // -> fuel / brightness
  ageHours: number; // -> subtle angular drift
}

/** A top-level comment, rendered as a moon orbiting the thread-star. */
export interface CommentNode {
  id: string;
  author: string;
  excerpt: string;
  score: number; // -> fuel / brightness / mass
  replyCount: number; // -> satellite count
  ageHours: number; // -> orbital drift speed
  replies: ReplyBranch[];
}

/** Real comments/replies for one thread, fetched on demand when diving in. */
export interface ThreadResponse {
  threadId: string;
  comments: CommentNode[];
}

// ---- Live cosmos (per-galaxy activity pulse) ----

/** Live activity signal for one galaxy, sampled from its subreddit. */
export interface GalaxyPulse {
  sub: string; //       subreddit slug (lowercase) the client keys on
  activity: number; //  0..1 normalised across the sampled set -> pulse + glow
  score: number; //     summed recent score    -> fuel
  comments: number; //  summed recent comments  -> nerves / moons
  posts: number; //     recent post count       -> stars
}

/** Live activity for the whole foundational set, cached briefly server-side. */
export interface CosmosResponse {
  galaxies: GalaxyPulse[];
  sampledAt: number; // epoch ms of the underlying Reddit read
}
