# Substrate

> A subreddit, rendered as one living cyber-organism floating in the void.
> Posts grow as **organs**, comments branch as **nerves**, upvotes surge as
> **electric blood**, views drift in as **oxygen**, and controversy flares as
> **inflammation**. Every day the community returns to see what the organism
> became overnight — and to vote on what it grows next.

Built for Reddit's **Games with a Hook** hackathon on **Devvit Web** + **Phaser**.

**Tagline:** *A living world grown from the soul of a subreddit.*

---

## The hook

The return reason isn't a streak counter — it's a question:

> **What did the community become overnight?**

Each night a scheduled digest reads the host subreddit's real activity, mutates
the organism, and posts a poetic **Today's Bloom**. Yesterday's community vote is
physically visible in today's world. One visit is never the whole story.

## The metabolic model (data → organism)

Everything you see is *derived structure* from real subreddit signals — never raw
user text painted in space. This is the moat, and it keeps the app moderation-safe.

| Subreddit signal | Organism element | How it reads |
| --- | --- | --- |
| New posts (24h) | **Organs** | glowing nodes growing on the disc |
| Comments / replies | **Nerves** | branching light veins between organs |
| Upvotes / score | **Lift current** | brightness, mass, rising orange particles |
| Views / attention | **Oxygen** | pale blue atmospheric mist & halos |
| Controversy (reports) | **Inflammation** | red storm flashes |
| Recurring keywords | **Emergent species** | named motifs the community canonizes |
| Flairs | **Biomes** | colored tissue regions around the rim |
| All-time top posts | **Fossils** | monuments embedded in the crust |

Each organ is classified into a **vital state** — Dormant Seed, Breathing Seed,
Nerve Bloom, Sun Organ, Storm Organ, Fossil Core, Spore Gate — so the world is
legible at a glance and rewards zooming in.

## The daily loop

1. **Digest** — open the post, read what changed overnight.
2. **Explore** — tap any organ to see the real post that grew it.
3. **Act** — one daily action: Explore / Nurture / Stabilize / Seed / Name.
4. **Growth Ritual** — one vote: Ventilate / Perfuse / Prune / Incubate / Bloom.
5. **Return** — tomorrow the winning mutation is physically there.

## Why it fits the brief

- **Delightful UX** — one sacred object in space, glass panels, glow, a zoom
  ladder (World → Region → Organ → Signal). No dashboard, no charts.
- **Reddit-y, not Reddit-themed** — the community *is* the content; we never
  cosplay Snoo/karma. We render the texture of a real community.
- **Hook-y** — overnight consequence + community authorship.
- **Polish** — mobile-first viewport, deterministic layout (same world for every
  viewer), graceful empty-state seeded from all-time fossils.
- **User contributions** — abuse-proof by construction: curated symbols and
  candidate-name voting, aggregated, never shown verbatim.

## Architecture

```
Reddit post (interactive)
 └─ Webview  (Vite static bundle)
     ├─ Phaser  OrganismScene  — the living world (src/client/game)
     └─ Glass UI overlays      — digest, detail, ritual, actions (src/client/ui)
         fetch() ↕ JSON
 └─ Devvit Web server (src/server)
     ├─ GET  /api/init    → world state + this user's daily status
     ├─ POST /api/action  → idempotent daily action
     ├─ POST /api/vote    → growth-ritual vote
     └─ /internal/...      → nightly scheduler, menu action, install trigger
 └─ Redis (KV)  — world state, per-user/day action & vote, streaks, atlas
 └─ Reddit API — read host subreddit; post the daily "Today's Bloom"
 └─ Scheduler  — nightly digest → mutate world → post tomorrow's bloom
```

Determinism rule: given the same `seed` + digest input, the layout is reproducible,
so every viewer sees the identical organism and reloads are stable.

## Project layout

```
src/
  shared/      types.ts (world contract) · vocab.ts (the biological language)
  server/      index.ts (endpoints) · digest.ts (reads subreddit)
               classify.ts (signals → structure) · world.ts (evolution)
               copy.ts (poetic digest) · storage.ts (Redis) · rng.ts (determinism)
  client/      index.html · style.css · main.ts (boot)
               game/OrganismScene.ts (the hero visual) · game/palette.ts
               ui/panels.ts (glass overlays) · api.ts
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

- No raw user text is rendered in 3D space; only derived structure.
- No free-text UGC in the MVP — curated symbols + candidate-name voting.
- Reads run once nightly via the scheduler (not per-view); per-view reads are
  Redis-only, staying well within API limits.
