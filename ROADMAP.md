# substrataaa — roadmap

> *Reddit as a living cosmos.*

Progress is tracked live in the left panel of the app itself.
Milestones are defined in `src/client/world/progress.ts`.

---

## Phase 1 — The Living Canvas ✅

Foundation: a cold-rendered, infinitely zoomable 3D cosmos where every pixel maps to real Reddit data.

| Milestone | Status | Detail |
|-----------|--------|--------|
| Cold rendered cosmos | ✅ done | Three.js PBR · ACES tone mapping · bloom · vignette |
| Planet organism | ✅ done | PBR core sphere · Fresnel membrane skin · vascular wireframe |
| Subreddits as galaxies | ✅ done | Spiral particle halos · cosmic web filaments · floating labels |
| Posts as stars | ✅ done | Vital-state colour · lift → mass · title labels on brightest |
| Infinitely zoomable | ✅ done | COSMOS → GALAXY → STAR → ORBIT → MOON · breadcrumb counts |
| Concept-matched UI | ✅ done | Left stats panel · right inspector · ∞ POSSIBLE PATHS ∞ bar |

---

## Phase 2 — Real Reddit Data at Depth ✅

Live Reddit data wired through the entire zoom ladder.

| Milestone | Status | Detail |
|-----------|--------|--------|
| Comments as moon-orbit | ✅ done | Live `/api/thread` · golden-angle distribution · score → fuel |
| Replies as satellites | ✅ done | Score → fuel · recency → orbital drift speed |
| Nightly world digest | ✅ done | Scheduled 08:00 UTC · metabolises overnight activity data |
| Daily community action | ✅ done | vote / ventilate / perfuse / prune / incubate / bloom |
| Live galaxy pulse | ✅ done | Cached `/api/cosmos` · real activity → glow, pulse, spin, airflow |

---

## Phase 3 — Depth + Lore 🔨

The world accumulates memory and the community leaves a permanent mark.

| Milestone | Status | Detail |
|-----------|--------|--------|
| Fossil monuments | 🔨 partial | Iconic old posts crystallised in the planet crust |
| Storm visualisation | 🔨 partial | Controversial threads render as atmospheric disturbances |
| Keyword creatures | ⬜ planned | Recurring motifs evolve into named species over time |
| Moon lifecycle | ⬜ planned | ASLEEP → CRACKED → GLOWING → HATCHED per comment activity |
| Community atlas log | ⬜ planned | Append-only mythology: blooms, storms, named species |

---

## Phase 4 — Polish + Hackathon Submission ⬜

The final gate before the Games with a Hook entry.

| Milestone | Status | Detail |
|-----------|--------|--------|
| Today's Bloom post | ⬜ planned | Nightly digest auto-creates a living update post in the sub |
| Explorer presence | ⬜ planned | Other users visible as moving light-traces across the cosmos |
| Live playtest | 🔨 partial | r/substratelab · substrataaa Devvit identity wired · auth gated |
| Hackathon submission | ⬜ planned | Games with a Hook · polished · paint-tested · submitted |

---

## Architecture constraints (non-negotiable)

- No file over 500 lines
- No god files — every module stays ignorant of the others
- Every visual maps to real Reddit data — no decorative noise
- Cold rendered visual direction — no glass cards, no glassmorphism
- No AI/copilot comments or generated boilerplate in committed code
- Build must pass `check + build:client + build:server` at every commit

---

## Data → cosmos canon

| Reddit signal | Cosmos representation |
|---------------|-----------------------|
| Views / attention | Light (oxygen) |
| Upvotes / score | Fuel (bloodflow) |
| Comments + replies | Nerves → moon orbits |
| Shares / crossposts | Spores |
| Controversy | Atmospheric storm |
| Post age | Growth stage / fossil depth |
| Subreddit | Galaxy biome |
| Post | Star (vital state coloured) |
| Top comment | Moon (score → mass) |
| Reply | Satellite |

---

*Concept: Substrate. App: substrataaa. Hackathon: Reddit Games with a Hook.*
