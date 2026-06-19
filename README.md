# Substrate

> **A living cosmos of Reddit.**
>
> Subreddits become galaxies, posts ignite as stars, comments orbit as moons,
> views become light, and upvotes fuel the systems that grow brighter each day.
> You begin outside all of Reddit — a breathing cosmic web suspended in space —
> then dive smoothly into a galaxy, a star system, a single thread, and finally
> the orbiting signal-tissue of one conversation. Every day the universe has
> evolved overnight, and the community shapes what it becomes next.

Built for Reddit's **Games with a Hook** hackathon on **Devvit Web** + **Three.js**.

**Tagline:** *Zoom through Reddit as one living universe.*

---

## The hook

The return reason isn't a streak counter — it's a question asked at two scales:

> **What did Reddit become overnight?** (the whole cosmos)
>
> **What did *my* community become overnight?** (your home galaxy)

Each night a scheduled digest reads real subreddit activity, evolves the world,
and posts a **Today's Bloom**. Yesterday's community vote is physically visible in
today's universe. One visit is never the whole story.

## The canon (data → cosmos)

Everything you see is *derived structure* from real Reddit signals — never raw
user text painted into space. The metaphor is **cosmic on the outside, alive on
the inside**: zoomed out it reads as galaxies and star systems; zoomed in the
signals pulse like living tissue.

| Reddit signal | Cosmic body | How it reads |
| --- | --- | --- |
| All of Reddit | **The universe** | a breathing cosmic web in deep space |
| Subreddit | **Galaxy / biome** | a luminous region with its own character |
| Post | **Star / planet** | ignition on creation; bright suns when hot |
| Comments | **Orbits / signal trails** | bodies orbiting the post-star |
| Replies | **Moons / nested orbits** | fractal satellite chains down the thread |
| Upvotes / score | **Fuel / gravity** | luminosity and gravitational pull |
| Views / attention | **Light** | radiant halos; low-view posts are dark seeds |
| Crossposts / shares | **Comets** | matter carried between galaxies |
| Controversy | **Solar flares** | volatile, crackling, radiation storms |
| All-time top posts | **Fossil stars** | ancient, preserved, embedded in the dark |

Each post is classified into a **vital state** — Dormant Seed, Breathing Seed,
Nerve Bloom, Sun Organ, Storm Organ, Fossil Core, Spore Gate — so the world is
legible at a glance and rewards descending into it.

## The endless zoom

The core mechanic is one continuous descent through scale:

```
REDDIT UNIVERSE  →  SUBREDDIT GALAXY  →  THREAD STAR SYSTEM  →  POST STAR  →  COMMENT ORBIT  →  REPLY MOON
```

You start outside all of Reddit looking at the cosmic web. You dive into a galaxy
like r/gaming, then into one hot post as a star system, then into its comments as
moons and signal trails, until you're reading a single comment at the smallest
scale. Smooth transitions and new structure at every layer make it feel infinite.

Foundational subreddits anchor the universe's form — the largest, most central
communities are the major galaxies; smaller ones drift as satellite clusters and
dwarf galaxies around them. Your home subreddit is highlighted as *your* galaxy.

## The daily loop

1. **Arrive** — see how the universe evolved overnight, at macro and local scale.
2. **Descend** — zoom from the cosmos into a galaxy, a star system, a comment orbit.
3. **Inspect** — select any body to read the real post, comment, or thread behind it.
4. **Shape** — one daily ritual: **Ignite / Stabilize / Chart / Name / Terraform / Preserve**.
5. **Return** — tomorrow the community's chosen evolution is physically there.

## Why it fits the brief

- **Wonder first** — one continuous cosmos, glass overlays, smooth semantic zoom.
  No dashboard, no charts.
- **Reddit-y, not Reddit-themed** — the community *is* the content; the structure
  is grown from real activity, never cosplay.
- **Hook-y** — overnight consequence plus dual-scale curiosity (all of Reddit and
  your own galaxy) plus community authorship.
- **Polish** — mobile-first viewport, deterministic layout (same world for every
  viewer), graceful empty-state seeded from all-time fossils.
- **User contributions** — abuse-proof by construction: curated symbols and
  candidate-name voting, aggregated, never shown verbatim.

## Architecture

```
Reddit post (interactive)
 └─ Webview  (Vite static bundle)
     ├─ Three.js scene   — the living cosmos (src/client/scene)
     └─ Glass UI overlays — HUD, contextual cards (src/client/ui)
         fetch() ↕ JSON
 └─ Devvit Web server (src/server)
     ├─ GET  /api/init    → world state + this user's daily status
     ├─ POST /api/action  → idempotent daily action
     ├─ POST /api/vote    → growth-ritual vote
     └─ /internal/...      → nightly scheduler, menu action, install trigger
 └─ Redis (KV)  — world state, per-user/day action & vote, streaks, atlas
 └─ Reddit API — read host subreddit; post the daily "Today's Bloom"
 └─ Scheduler  — nightly digest → evolve world → post tomorrow's bloom
```

The render layer is split by responsibility, one job per file, nothing oversized:

```
src/client/scene/
  core/         RendererManager · FrameLoop · SceneRoot
  camera/       CameraController (orbit + dolly) · ZoomController (the zoom ladder)
  interaction/  RaycastManager · PointerInput · SelectionStore
  world/        Atmosphere · PlanetShell · BiomeField · ThreadField
  effects/      UpvoteCurrent (pooled particles)
  raycastable.ts (selection contract) · SubstrateController.ts (orchestrator)
```

Determinism rule: given the same `seed` + digest input, the layout is reproducible,
so every viewer sees the identical universe and reloads are stable.

## Project layout

```
src/
  shared/        types.ts (world contract) · vocab.ts (the canon language)
  server/        index.ts (endpoints) · digest.ts (reads subreddit)
                 classify.ts (signals → structure) · world.ts (evolution)
                 copy.ts (poetic digest) · storage.ts (Redis) · rng.ts (determinism)
  design-system/ tokens.ts (palette + type) · nebula.ts · membrane.ts · index.ts
  client/        index.html · style.css · main.ts (boot)
                 scene/ (the cosmos render stack) · ui/ (HUD + cards)
                 world/foundational.ts (the foundational galaxies) · api.ts
```

## Develop

```bash
npm install
npm run check     # typecheck
npm run build     # build client + server bundles
npm run dev       # devvit playtest on your test subreddit
npm run launch    # build + devvit publish
```

> You'll need the Devvit CLI authenticated (`npm i -g devvit && devvit login`)
> and a test subreddit you moderate. After install, use the subreddit menu item
> **"Substrate: grow this community's organism"** to create the first post.

## Notes on safety & scope

- No raw user text is rendered in space; only derived structure.
- No free-text UGC in the MVP — curated symbols + candidate-name voting.
- Reads run once nightly via the scheduler (not per-view); per-view reads are
  Redis-only, staying well within API limits.
- For the hackathon the whole-Reddit cosmos is an *illusion of scale*: the full
  universe and a set of foundational galaxies are visible, with the home galaxy
  and one deep zoom chain fully realized.
