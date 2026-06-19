# Substrate

A living 3D biome grown from a subreddit's posts, comments, upvotes, and motion.

Every subreddit has one organism floating in space. It isn't a metaphor laid over the
community — it's built from the community. Posts are seeds. Comments are speech-spores
drifting along threadroots. Replies branch underneath like roots. Upvotes are heat and
lift. Controversy is weather. Recurring topics breed species. Old top posts fossilize.
Flairs are the geography. The world is not decorative. The world is the subreddit.

The whole game is one sentence:

> Open the post. See what the subreddit became overnight. Zoom into the living content.
> Cast one action. Come back tomorrow to see the mutation.

That's it. The discipline is in protecting that loop from everything that would clutter it.

---

## The one principle

It should feel like a **cosmic microscope**, not a sci-fi control panel.

NASA instrument meets alien terrarium meets a comment section turned biological. One
breathtaking object in the center, a few precise labels, sparse glass, and nothing on
screen that doesn't earn its place. The failure mode we are actively avoiding is "beautiful
cosmic dashboard" — eighteen panels glowing at once, metrics pretending to be gameplay,
neon for its own sake. Every visual has a reason. Every motion means something.

---

## The core screen

One floating biome, centered, in space.

At a glance it reads as a tiny glowing ecosystem — ridges, canopy, reef, cloud, lava,
roots, ocean. Then you notice the comments are *moving through it*. A comment like "this
is insane" isn't buried in a list; it's a glowing spore drifting along a threadroot, an
orange upvote current pulling it upward, its replies branching beneath it, its parent post
a seed-island below. That recognition — *those are the actual comments* — is the moment the
thing turns from art into a place.

Persistent UI is only four zones, and nothing else stays on screen:

- top-left: subreddit identity + date
- top-right: a single pulse number
- bottom: the zoom scale + today's one action
- side drawer: details, and only when something is selected

Everything else appears on touch and leaves when you let go.

---

## Endless zoom — the signature

The scale bar is the spine of the whole thing. It is not a menu; each stop is a real place
you fly into, still floating in space, the layer above dissolving into the one below.

```
WORLD → REGION → THREAD → COMMENT → REPLY → SPORE
```

- **World** — the entire subreddit as one organism, breathing at its own pace.
- **Region** — flair and topic biomes: Meme Reef, Debate Basin, Tutorial Grove, Lore
  Thicket, Fossil Archive. Each looks distinct enough to navigate by feel.
- **Thread** — a single post becomes a living island/organ. Title visible, score drives
  brightness, comment count drives root density.
- **Comment** — a literal comment floats as a capsule on the root network. Upvotes make it
  glow and rise; replies branch and orbit.
- **Reply** — the micro-structure: reply chains as tendrils, arguments as lightning, jokes
  as spores, long chains as vines.
- **Spore** — a small contributor mark: *this user seeded this part of the biome.* Not a
  profile, just authorship made visible.

There is always a smaller layer to fall into. That bottomlessness is half the pull.

---

## How the subreddit is rendered

Literal, not symbolic. This is the Three.js mapping.

**Posts → seeds.** Embedded in the surface. Score controls brightness, comment count
controls root size, age controls state (fresh seed → bloom → fossil), flair controls which
biome it grows in.

**Comments → speech-spores.** Real excerpts drift near their threadroot. Upvotes pull them
up, replies branch below, recent ones drift faster, the top comment ripens into fruit or a
star.

**Upvotes → motion.** Never a bare number. Orange particles rising, lift currents, heat
rings, fruit swelling, faster orbit around popular nodes.

**Threads → roots.** A long thread is a visible root system — direct replies are branches,
deep chains are tendrils, removed comments are dim gaps, reply bursts pulse like nerve
signals.

**Activity → weather.** Calm day: slow drift, soft glow. Busy day: meteor spores, pulse
waves. Heated debate: lightning. Wholesome surge: aurora. Meme spike: fungal bloom.

---

## Color is a language, not decoration

Six meanings, learned in one session, never broken:

- **purple** — comments / conversation
- **orange** — upvotes / heat / lift
- **blue** — new activity / fresh motion
- **green** — stable, healthy growth
- **red** — controversy / storms / tension
- **white / gold** — rare discoveries, fossils, monuments

Once a player knows the palette they can read the world without reading a word.

---

## The daily loop

Each day the biome digests the last 24 hours, and the post tells the story in the world's
own language:

> The Meme Reef expanded. A storm formed over the Debate Basin. A top comment ripened into
> a Lantern Fruit. A recurring phrase grew legs and became a species. Yesterday's best post
> hardened into a monument in the Archive.

Then you get **one action**. One, per day. Scarcity is what makes the visit matter:

Explore a hidden threadroot · Nurture a biome's growth · Stabilize a storm · Seed a spore ·
Name a new species or region · Evolve — vote on tomorrow's mutation.

The loop: the subreddit makes raw activity → Substrate renders it → the community chooses
what grows → tomorrow the world visibly changes. The reward is never points. The reward is
**consequence you can see**.

---

## Why you come back (the honest mechanics)

The hook is emotional, not transactional. Not "claim your daily reward" — "what did we
become overnight?" The retention is engineered, but out of anticipation and stakes, not
dark patterns:

- **The overnight reveal.** You never quite know what your votes produced. Yesterday → today
  is a visible before/after.
- **A shared clock.** One countdown to the next growth cycle. The vote closes; your single
  action can tip it. The timer creates the anticipation.
- **Event days.** Some mornings carry a rare state — New Species Discovered, Storm Forming,
  Fossilization Event, Migration, Bloom Window, Naming Ritual, Rare Alignment. They only
  happen if the community's activity earns them, and only the people who showed up see them
  first.
- **Streaks, lightly.** Consecutive days are visible and worth protecting, never punishing.
- **Discovery at depth.** Being first to fall all the way to the word-level of the top
  thread is its own reward — a title, a mark on the spore.
- **Accumulated memory.** The world keeps a history, and that history is the real addiction:
  *Day 1 first seed · Day 2 the storm split the basin · Day 3 a comment became a monument ·
  Day 5 the river got named Greg · Day 7 the whole biome hit Aurora Bloom.* A week in,
  nobody wants to abandon a world they built.

---

## The game layer, kept thin

The complexity lives in the world, not the rules. Three systems, nothing more:

1. **Discovery** — tap around, uncover living content. *Lantern Fruit — grown from the
   comment "this changed how I see this" · 428 upvotes · 19 replies · rising.*
2. **Cultivation** — the community votes what grows next: Nourish the Canopy · Stabilize the
   Storm · Awaken the Archive · Expand the Reef.
3. **Memory** — the world remembers, and the history compounds.

---

## What the Reddit post looks like

Title carries the hook on its own:

> r/earthporn's biome changed overnight — a new mountain root has formed.

Inside: the floating biome, a thin **Today's Bloom** overlay (23 new seeds · 1.2k comments ·
8.4k upvotes · Waterfall Basin expanded · a top comment became a Lantern Fruit), the daily
vote with four buttons, and one line: **next growth cycle in 08:34:22.**

---

## Stack

Devvit Web. The client is a static bundle Reddit serves inside the post; the server is a set
of small endpoints beside it. No Next.js — there's no server-render host on this platform.

- **Client:** Vite + React + TypeScript. The biome is React-Three-Fiber with drei and a
  single bloom pass. Phone first.
- **Server:** Devvit endpoints. Reads the host subreddit (posts, comments, scores, flairs),
  holds the world state in key-value storage, runs the nightly digest on the scheduler.
- **One source of truth:** the server authors the world from a shared seed; clients only
  render it, so everyone sees the same place and reloads are stable.

One scene, swappable layers. Growth is parameters changing, not new scenes being built —
that's what keeps it shippable.

---

## Contributions, kept clean

Hands on the world, nothing to deface. Seeds come from a fixed symbol set. Names are voted
from a short candidate list, not free-typed. Growth is a bounded choice. Nothing one person
writes is rendered verbatim, yet the world is collectively authored. Quiet or brand-new
subreddits never look empty — they open as a dormant spore with their all-time best posts
already fossilized into the ground, so there's always something to find.

---

## The MVP — one perfect slice

Not the whole galaxy. One subreddit, made to feel alive:

1. fetch recent posts and comments
2. grow one floating biome
3. posts as seeds, comments as literal floating spores
4. upvotes as orange upward currents, threads as branching roots
5. zoom: World → Thread → Comment
6. one daily vote on what grows next
7. next day, a visible mutation

That is enough to feel like magic.

---

## Pitch

> Substrate turns a subreddit into a living 3D biome floating in space. Posts become seeds,
> comments become branching roots, upvotes become glowing motion currents, and the
> community's daily choices shape what the organism grows next. Every day, people return to
> see what their subreddit became overnight.

Not a pretty cosmic dashboard. **Reddit as a living organism you can explore.**
