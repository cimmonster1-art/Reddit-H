# Substrate

A subreddit, grown into a living world.

Open the post and you're looking at your community as an organism floating in space.
Not a chart of it — the thing itself. Every comment is a moving cell, every upvote is
light, every thread is a root reaching for the next. It drifts, it pulses, it changes
overnight while you're gone. You come back to see what it became.

This works for any subreddit. r/biology grows a cellular rainforest. r/popculturechat
grows a gossip reef that flashes when something breaks. r/brisbane grows a river the
shape of its own arguments. Same engine, a different creature every time, because the
creature is made of the community.

---

## The feeling we're after

Wonder first. Before anyone reads a word, the screen should make them stop. A dark field,
a single luminous body suspended in it, slow motion, depth. The kind of thing you turn
your phone sideways for.

Then legibility. Tap the glowing knot near the top and it tells you: this is the thread
about the lost dog, 340 comments, still growing. The argument storm over the eastern
ridge is the mod policy thread. The bright fruit that just ripened is today's top post.
The wonder and the meaning are the same object, seen at two distances.

We are not building a dashboard wearing a costume. No charts, no percentages, no
"engagement up 12%." If a number ever appears it's because it's beautiful, not because
it's data.

---

## What you're actually looking at

The world is built from the subreddit's real activity, read fresh each day.

- **Comments** are the living matter — small bodies that drift, cluster, and trail
  filaments to whatever they replied to. A busy thread is a swarm. A dead one is a few
  cells holding still.
- **Upvotes** are light and mass. Score makes a thing brighter, hotter, larger. The top
  post of the day is the closest thing to a sun.
- **Threads** are root systems — branching veins of light that grow as the conversation
  deepens. Depth becomes length, breadth becomes spread.
- **Heated threads** (lots of replies, low score, fast motion) become weather. Storms,
  arcs, turbulence over the part of the world that's fighting.
- **Recurring topics** become species. The same word surfacing day after day breeds a
  small repeating creature that lives in the world and migrates between regions.
- **Flairs** are the geography — separate biomes on the surface.
- **Old, legendary posts** fossilize. They stop moving and become landmarks: a monument,
  a cracked moon, a ruin the new growth grows around.

Motion is the point. Nothing is a static diagram. The whole body breathes at the
subreddit's pulse — fast when the place is awake, slow and tidal when it's quiet.

---

## The day

Each morning the world has changed. A scheduled job reads the last 24 hours, folds it
into the world's state, and posts the day's update in the feed. That post is the heartbeat
and the reason to return.

The update speaks in the world's own language, never in metrics:

> The canopy thickened overnight. A storm opened over the debate basin. The word "frog"
> surfaced for the third day and has become something with legs. Yesterday's top thread
> went quiet and hardened into a monument near the south pole.

Inside, you get one move a day:

- **Explore** — uncover a hidden part of the world.
- **Nurture** — feed a region so it grows tomorrow.
- **Stabilize** — calm a storm before it spreads.
- **Seed** — drop a small mark into the world from a fixed set of symbols.
- **Name** — vote on what to call a new creature or place.

And one shared decision: the community votes on what grows next. Tomorrow that vote is
visible. Not "+20 points" — the moon actually has teeth now, because you all decided it
should. Consequence you can see is the whole hook.

Over a week the place accumulates a history. Day three the reef appeared. Day four someone
named the recurring creature Greg. Day six Greg wandered into the politics swamp and hasn't
come out. That shared mythology is what people come back for, more than any score.

---

## Typography and surface

Restraint is the entire look. The wrong move is a dozen glowing fonts; the right move is
two faces, used with discipline, and a lot of empty space.

- **Display / numerals:** one quiet, high-contrast serif for the few large moments — the
  world's name, a day count, a single headline on the daily card. Something with real
  drawing in it, not a default. *Fraunces* (optical sizing, light weight) reads expensive
  and is open-licensed. Used sparingly, large, with tight leading.
- **Everything else:** one neutral grotesque, a single weight, generous line spacing.
  *Söhne* or *ABC Diatype* if there's budget; *Geist* or *Inter Tight* if not. Never more
  than two weights on screen at once.
- **Labels and controls:** small caps, generous letter-spacing (roughly 0.12em), low
  contrast against the dark. They should feel etched into the instrument, not printed on top.
- **Scale:** a tight type ramp — one display size, one body, one label. No in-between
  sizes improvising. Discipline reads as money.
- **Color:** near-black field, one warm accent (a low gold), one cool accent (a pale
  cyan), white used at maybe 80% so nothing screams. Glass panels are barely there — a
  hint of blur, a one-pixel light edge, no heavy borders.

The test for every screen: would this look at home in a planetarium, or does it look like
an app. We want the planetarium.

---

## How it's built

Devvit Web. The client is a static bundle Reddit serves inside the post; the server is a
set of small endpoints alongside it. No Next.js — there's no host for server rendering on
this platform, and pretending otherwise burns days. The honest stack:

- **Client:** Vite, React, TypeScript. The world is React-Three-Fiber with drei, and a
  single bloom/postprocessing pass for the glow. Everything is built to fit a phone first.
- **Server:** Devvit endpoints. Reads the host subreddit (posts, comments, scores, flairs)
  through the platform's Reddit API, holds the world state in key-value storage, and runs
  the nightly digest on the scheduler.
- **One source of truth:** the server writes the world; clients only render it, from a
  shared seed, so every visitor sees the same thing and reloads are stable.

The whole game is one scene with swappable layers. Growth is parameters changing — a
biome's color, a moon's state, a species' population — not new scenes being built. That's
what keeps it shippable.

---

## Contributions, kept clean

People shape the world without typing into it. Seeds come from a fixed set of symbols.
Names are chosen from a short candidate list by vote, not free text. Growth is a bounded
choice. Nothing a single person writes is rendered verbatim into the world, so there's
nothing to abuse, and the world still ends up collectively authored. That's the strong
version of user-generated content here: everyone's hands are on it, no one can deface it.

---

## Scope, honestly

One world, done well, beats ten worlds half-built.

- First, prove the platform: a real interactive post, a server endpoint answering, the
  subreddit readable, a lit sphere breathing on an actual phone.
- Then the static world: layers, the daily card, tappable knots that open and explain
  themselves, the zoom from world down to a single comment.
- Then the real feed: the nightly digest turning 24 hours of the subreddit into the world's
  next state.
- Then the loop: one daily action, the shared vote, tomorrow showing the result, the
  history filling in.
- Then polish until it looks launch-ready, with a demo subreddit grown over several days
  so the evolution is visible at a glance.

Quiet subreddits never look empty — a new or sleepy community starts as a dormant spore
with its all-time best posts already fossilized into the ground, so there's always
something to find.

---

## In one line

Substrate renders any subreddit as a living world made of its own comments, votes, and
motion — and quietly rebuilds it every night, so the community keeps coming back to see
what it grew.
