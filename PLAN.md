# Substrate — Build Plan

> A living 3D world grown from a subreddit's activity. Posts become seeds, comment
> threads become root systems, debates become storms, recurring topics become species,
> and iconic moments fossilize into ruins. The community returns daily to explore what
> grew overnight, name discoveries, and vote on what evolves next.

**Hackathon:** Reddit "Games with a Hook" (Devvit Web + Phaser). Deadline **16 Jul 2026, 11:00am GMT+10**.
**Tagline:** *A living world grown from the soul of a subreddit.*

---

## 0. Reality check on the stack (read this first)

The brainstorm said "Next.js, three.js, react." One of those is wrong for this platform, and it
matters before we write a line of code:

- **Next.js does NOT fit Devvit Web.** Devvit runs your UI as a **static webview bundle** inside a
  Reddit post (an iframe-like sandbox) plus a **serverless Node server** for endpoints. There is no
  long-lived Node host to run Next's SSR/ISR/route handlers, no custom domain, and no Next runtime.
  Trying to force Next.js in is the #1 way to waste 3 of our 26 days.
- **Correct client stack:** **Vite + React + TypeScript + React-Three-Fiber (R3F)** for the 3D world,
  `@react-three/drei` for helpers, `@react-three/postprocessing` for the bloom/glow look from the
  reference UI. This is the supported, documented path and builds to the static bundle Devvit serves.
- **Server:** Devvit Web server endpoints (Node, Express-style handlers). Reddit API + Redis-style
  key-value storage + the scheduler all live here.
- **Phaser:** used for the **2D juice layer** (drag-to-feed/seed micro-interactions, particle
  bursts, creature idle animation) composited over or beside the R3F world. This keeps us eligible
  for the **Best Use of Phaser** sub-prize without betting the whole 3D world on Phaser's 3D.

> Decision needed from you: do we want Phaser in scope at all? It adds a sub-prize lane but costs
> ~2 days of integration. Default assumption below: **R3F is the hero; Phaser is an optional overlay
> we add only if the 3D loop is already solid.**

---

## 1. Why this wins (mapping to the actual judging criteria)

| Criterion | How Substrate scores |
|---|---|
| **Delightful UX** | A cosmic "observatory instrument" framing: dark space, glass panels, glow, a zoom ladder from world → biome → organism → cell → spore. Wonder before lore. |
| **Polish** | One world scene with swappable layers, mobile-first viewport, tutorial overlay. We ship a vertical slice that looks launch-ready, not 40 half-built worlds. |
| **Reddit-y** | The community literally *is* the content. We read the host subreddit's real posts/comments and render them. Not Snoo/karma cosplay — actual community texture. |
| **Hook-y** | The world visibly changes overnight based on yesterday's real activity + the community vote. "What did the subreddit become?" is the return reason. |
| **Phaser Innovation** (sub) | Optional overlay handles tactile input + particles; documented as a deliberate 2D/3D split. |

Targeted prizes, in priority order: **Best App with a Hook ($15k)** → **Best Use of Retention ($3k)**
→ **Best Use of User Contributions ($3k)** → **Honorable Mention** floor if polished.

---

## 2. The "AI slop" trap and how we dodge it

The brief explicitly penalizes AI slop, on-the-nose Reddit theming, literal "hook" games, and common
genres (space shooters, trivia, collab-story clones). Our guardrails:

1. **One coherent identity.** Everything is biological/cosmic language, never analytics language.
   "The canopy thickened," not "post volume +12%." No charts, no engagement scores, no dashboard.
2. **Fits the viewport.** Mobile-first. One world, big tap targets, no scroll-to-find-the-game.
3. **It must read real subreddit data**, or it's just a generic toy with a Reddit skin. The data→visual
   pipeline is the moat.
4. **Restraint.** Not "Bio Galaxy inside Reddit." One charming organism in one polished scene.

---

## 3. Core loop

```
Open post ─► See what the world became overnight (the digest applied)
   │
   ▼
Explore ─► tap a glowing region/hotspot ─► discovery card explains the REAL post/thread that caused it
   │
   ▼
Act (one daily action per user):
   • Explore  – reveal a hidden hotspot
   • Nurture  – add growth weight to a region
   • Stabilize– calm a storm/decay event
   • Seed     – drop a safe predefined spore/symbol
   • Name     – vote on a name for a new discovery
   │
   ▼
Community vote ─► "What grows next?" (nourish reef / stabilize storm / awaken fossil / hatch species)
   │
   ▼  (overnight, via Devvit scheduler)
Digest job ─► fetch last 24h of subreddit content ─► classify ─► mutate world state ─► post/update tomorrow
```

The non-negotiable payoff: **tomorrow's post must show consequence**, phrased as a story
("The community fed the moon. The moon now has teeth."), not a score delta.

---

## 4. Data → visual mapping (the moat)

Server digest reads recent subreddit content via the Devvit Reddit API (app reads posts, comments,
scores, flairs of the host subreddit) and buckets it. **No raw user text is rendered in 3D** — we
render *derived structure*, which sidesteps most UGC-safety risk (see §7).

| Subreddit signal | World element | Visual |
|---|---|---|
| New posts (24h) | Seeds / blooms / eggs | Germinating nodes on the surface |
| Comment threads (depth/breadth) | Root systems / mycelium | Branching light veins |
| Upvotes / score | Luminosity, mass | Brighter, larger, fruiting nodes / suns |
| Controversial / high-reply-low-score | Storm organs / vents | Atmospheric turbulence, lightning |
| Recurring topics (keyword clusters) | Species / biomes | Repeating creature silhouettes, zones |
| Flairs | Ecological regions/kingdoms | Distinct surface biomes |
| Activity rate | Pulse / tides / weather | Heartbeat glow, orbit speed |
| Old iconic top posts | Fossils / ruins / monuments | Static landmark geometry |
| User contributions | Spores / relics | Named micro-objects (curated set) |

Classification v1 is deliberately dumb and robust: counts, score buckets, reply/score ratios, flair
grouping, and a stopword-filtered keyword frequency map for "recurring topics." No LLM needed for MVP;
optional later.

---

## 5. Screen map & UI language (borrowing the reference aesthetic — legally)

The reference screenshots are **your own apps (Heliora / Bio-Galaxy)**. We reuse **your** design
system — not third-party/copyrighted art. Concretely we lift:

- dark cosmic backdrop + particle drift
- soft purple/navy **glass panels** with rounded corners
- gold/white/cyan accent lights, bloom/glow postprocessing
- the **zoom/scale slider** and floating instrument-panel controls
- object-in-space framing and orbital rings

> Asset note / edge: reusing your own prior CSS tokens, shader snippets, and panel components is a
> legitimate speed edge and gives instant identity. **Do not import any third-party astrology art,
> stock models, or fonts without a license** — the brief rewards a *unique identity*, and Devvit
> review will reject infringing assets. We recreate the *language*, not literal copyrighted files.

Screens:

- **World** (hero): the rotating organism-planet, hotspots, weather, orbit ring.
- **Today's Bloom** (overlay card): poetic summary of overnight digest.
- **Regions / Species / Archive** (overlay tabs): flair-biomes, recurring-topic creatures, fossil log.
- **Community Choice** (overlay card): the daily vote.
- **Zoom ladder** (bottom control): world → biome → organism → thread → cell → spore.

Verb reskins: Vote→**Guide Growth**, Open Post→**Enter Region**, Top Thread→**Brightest Node**.

---

## 6. Retention mechanics (Best Use of Retention lane)

- **Daily digest post** = the heartbeat; scheduler-driven, appears in feeds.
- **Streaks & discoverer titles** (First Explorer, Door Opener, Cartographer) — identity without sweaty RPG stats.
- **Persistent Atlas**: accumulated community mythology ("Day 4: users named the creature Greg").
- **Weekly rare events**: eclipse / migration / hatch / festival to spike return.
- **Consequence visibility**: yesterday's vote is legible in today's world.

---

## 7. User contributions — Devvit-safe by construction (Best UGC lane)

Devvit rules push apps toward **constrained expression** (predefined dictionaries, emoji, symbols)
to limit abuse. Our UGC is safe by design:

- **Seed/offer**: pick from a **curated symbol/emoji set**, not free text.
- **Name**: names are **voted from a generated candidate list**, not free-typed (or free-typed names
  go through Reddit's standard moderation + a profanity filter + are mod-removable). Default to
  candidate-list voting for MVP to stay clean.
- **Vote**: bounded choices only.
- All contributions are **aggregated**, never shown verbatim as a 3D billboard. No DMs, no external
  links, no off-platform accounts (all Devvit-rule compliant).

This gives strong "user-generated content" signal (the world is collectively authored) without the
moderation liability of free text.

---

## 8. Architecture

```
Reddit Post (interactive)
 └─ Webview (static bundle, Vite)
     ├─ React UI shell (glass panels, tabs, zoom slider)
     ├─ React-Three-Fiber scene (world, layers, postprocessing)
     └─ [optional] Phaser overlay (input juice, particles)
         │  fetch() ↕ JSON
 └─ Devvit Web server (serverless Node)
     ├─ GET  /api/world      → current world state for this subreddit
     ├─ POST /api/action     → record a user's daily action (idempotent per user/day)
     ├─ POST /api/vote       → record growth vote
     └─ (internal) digest job → scheduler, runs nightly
 └─ Storage (Devvit KV/Redis): world state, per-user daily action, vote tallies, atlas log
 └─ Reddit API: read host subreddit posts/comments/flairs/scores; create/update daily post
 └─ Scheduler: nightly digest → mutate world → post "Today's Bloom"
```

**World state schema (v1):**
```ts
type WorldState = {
  subreddit: string;
  day: number;                 // sequential day index
  seed: number;                // deterministic RNG seed for layout
  biomes: Biome[];             // from flairs
  seeds: SeedNode[];           // from recent posts (id, score→size, age→stage)
  storms: Storm[];             // from controversial threads
  species: Species[];          // from recurring keyword clusters (name, population)
  fossils: Fossil[];           // from all-time/iconic top posts
  moon: { state: 'asleep'|'cracked'|'glowing'|'hatched' };
  weather: { pulse: number; event?: 'eclipse'|'meteor'|'aurora' };
  voteResultYesterday?: GrowthChoice;
  atlas: AtlasEntry[];         // append-only mythology log
};
```

Determinism rule: given the same `seed` + digest input, the layout is reproducible — so every viewer
sees the same world and reloads are stable.

---

## 9. MVP scope & day-by-day (26 days, generous buffer)

**Phase 1 — Prove the platform (Days 1–4)**
- `npm create devvit@latest` (Web template); get a hello-world interactive post on a test subreddit.
- Confirm: webview loads, server endpoint responds, can read subreddit posts, can write a post.
- Stand up R3F: a single rotating sphere with bloom postprocessing in the webview, on mobile.

**Phase 2 — Static world (Days 5–9)**
- World scene with swappable layers: base sphere, ocean/cloud, orbit ring, 5 hotspot anchors, particle weather.
- Glass-panel UI shell + zoom ladder (even if zoom is partly cosmetic in v1).
- Hardcoded `WorldState` → renders correctly. Discovery cards open on hotspot tap.

**Phase 3 — Real data digest (Days 10–14)**
- Server digest: fetch 24h subreddit content → classify into the buckets in §4 → write `WorldState`.
- Map real posts to seed nodes (score→size, age→stage), flairs→biomes, recurring keywords→species.
- "Today's Bloom" copy generator (templated poetic strings from the buckets).

**Phase 4 — The loop (Days 15–19)**
- Daily actions (idempotent per user/day) + growth vote, both persisted.
- Nightly scheduler: apply vote + new digest → mutate world → post tomorrow's "Today's Bloom."
- Atlas log appends each day's events. Streaks + first-discoverer titles.

**Phase 5 — Polish & juice (Days 20–24)**
- Sound, transitions, tutorial overlay, empty-state for low-activity subreddits.
- (Optional) Phaser overlay for seed/feed drag + particles, if loop is solid.
- Mobile pass: viewport fit, tap targets, perf budget (see §10).

**Phase 6 — Ship (Days 25–26)**
- Demo subreddit seeded with a few days of evolution, screenshots, app listing, submission copy,
  optional developer survey for the Feedback prize.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Three.js perf on mobile webview** | Hard budget: < ~30k tris, instanced meshes for seeds/species, capped DPR, single bloom pass, lazy detail on zoom. Test on real phone early (Day 4). |
| Next.js assumption wasting days | Killed up front (§0). Vite + R3F only. |
| Low-activity / brand-new subreddits look empty | Graceful empty-state ("dormant spore"); seed with all-time top posts as fossils so the world is never bare. |
| Reddit API rate limits / read scope | Digest runs once nightly via scheduler, not per-view; cache `WorldState` in KV; per-view reads are KV-only. |
| Free-text UGC abuse | Default to curated symbols + candidate-name voting (§7). |
| Scope creep ("40 worlds") | One world, swappable layers. Mutation = parameter changes, not new scenes. |
| Phaser integration eats the schedule | Phaser is explicitly optional/last (Phase 5). 3D loop must stand alone first. |
| Determinism / multi-viewer drift | Single server-authored `WorldState` + seed; clients render, never invent. |

---

## 11. Open questions for you

1. **Phaser in or out?** Default: optional overlay, added last. Confirm if you want it as a first-class goal.
2. **Naming:** `Substrate` (recommended), `Worldseed`, or `Threadbeast`?
3. **Per-subreddit vs. single showcase world** for the demo? Recommend one polished showcase subreddit
   we control, evolved over several days, so judges see history.
4. **Free-text names** allowed (with moderation) or **candidate-list voting only**? Recommend candidate-list for MVP.

---

## 12. One-line submission pitch

> **Substrate** turns a subreddit into a living 3D world. Each day it digests the community's real
> posts, comments, and culture into biomes, species, storms, and fossils — then the community returns
> to explore what grew overnight, name discoveries, and vote on what evolves next.
