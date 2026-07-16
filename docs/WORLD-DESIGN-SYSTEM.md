# Turbo Maze — World Design System

> **Why this exists.** Dad's insight (2026-07-15): our worlds are *themed*, but most don't
> really **feel** on-theme — BRAIN FREEZE does (blue + ice everywhere), the rest read as
> "the default game with themed mechanics bolted on." And as the game grows toward *a lot*
> of worlds, we need it to stay **coherent** and keep **elevating** — not sprawl into a bag
> of unrelated gimmicks. This doc is the repeatable recipe that solves both.

---

## 1. The theming-depth test: does a world FEEL like its theme?

A world feels on-theme when it commits across **five layers**, not just one:

| Layer | What it means | Where it lives |
|---|---|---|
| **1. Palette** | Owns 3–4 colors — the **ground and walls shift**, not just accents | `prerenderGround`, `SERIES[].hue` |
| **2. Atmosphere** | A world-aware **backdrop** (starfield, snowfall, factory haze, water shimmer) | *new: a backdrop layer* |
| **3. Signature mechanic** | A toy that **embodies** the theme (ice=slip, space=gravity/float, water=currents) | engine + `LEVELS` |
| **4. Set dressing** | A few themed decorative bits (icicles, gears, planets, bubbles) | draw code |
| **5. Language** | Level names + emoji that **evoke the place** | `LEVELS[].name/emoji` |

### Honest scorecard today
| World | Palette | Atmosphere | Signature | Dressing | Verdict |
|---|---|---|---|---|---|
| TURBO BASICS | accent only | shared dark | drift (weak theme) | — | generic (ok — it's the tutorial) |
| BRAIN FREEZE | blue accent | shared dark | **ice everywhere** ✅ | ice sheen | **the one that works** |
| MAZE MAYHEM | purple accent | shared dark | shifting walls | — | mechanic-deep, place-thin |
| METAL MELTDOWN | orange accent | shared dark | conveyors/crushers | — | mechanic-deep, place-thin |
| SPLASH ZONE | aqua accent | shared dark | splash/currents ✅ | ripples/foam | close — needs the water *ground* |

**The pattern:** every world **shares one dark-asphalt ground + orange lamp-pools**
(`prerenderGround`). Theming lives almost entirely in the accent `hue` + mechanic art. That's
why only the world whose mechanic is *visually pervasive* (ice) truly "feels" like its theme.

### The single highest-leverage fix: **the atmosphere layer**
Make the ground + backdrop **world-aware** (§5). This is one systemic change that lifts
*every* world at once — far more bang than hand-dressing levels. It's the thing to build next.

---

## 2. The world-identity card (fill one per world — keeps depth consistent)

```
World N — NAME  emoji
  Palette:     ground / wall / accent / glow  (4 hexes)
  Backdrop:    <the world-aware background>
  Signature:   <the 1 genuinely-new primitive>
  Supporting:  <1–2 remixed prior mechanics>
  Feel:        <any world-wide physics tweak>
  Difficulty:  <band on the gentle-climb curve; rival.mult range>
  Reward car:  <id + one-line art>
  Arc:         teach each toy solo → combine → boss(es) → finale + Golden Goat on the last
```

Filled cards for shipped + next worlds live in `SPLASH-ZONE.md`, `WORLD6-SPACE-OUTLINE.md`,
etc. New world? Fill a card first — if you can't fill all rows, it isn't themed deeply enough yet.

---

## 3. The mechanic-progression ladder (coherence + escalation over the game's life)

**The rule that keeps it coherent: each world introduces exactly ONE genuinely-new
*primitive*, and *remixes* everything before it.** That's what makes the pieces fit — a world
is "the new toy, played against the old toys," so difficulty and novelty climb together
without turning into soup.

| World | New primitive (the class of idea) | Remixes |
|---|---|---|
| 1 TURBO BASICS | drift + keys/doors/crates | — |
| 2 BRAIN FREEZE | **terrain modifiers** (ice, portals, timed gates) | drift, keys |
| 3 MAZE MAYHEM | **the maze itself changes** (shifting walls) | + all above |
| 4 METAL MELTDOWN | **moving hazards + timing** (conveyors, crushers, trap doors) | + all above |
| 5 SPLASH ZONE | **traversal toys + friction** (splash/airborne, sticky, foam) | + currents (=conveyors), slides (=ice) |
| 6 SPACE | **forces + float** (gravity wells, the void, low-G) + asteroids | + launches (=splash airborne), warps (=portals) |
| 7+ | *open slots — see below* | |

Notice the escalation of *kind*: cell-state → terrain → mutating maze → moving hazards →
traversal → **fields/forces**. Each is a new *category* of challenge, so the game keeps
feeling fresh even 6 worlds in. **Engine reuse is the connective tissue** — e.g. `car.airT`
runs splash→space; portals run brain-freeze→space wormholes; the crusher/patrol pattern runs
factory→asteroids. Reusing state across worlds is *why* it stays one coherent game.

### Candidate future primitives (so we can see the runway)
Keeps ~1 new primitive/world for a long time without repeating: **magnetism / one-way tracks
/ tempo-&-rhythm gates / size-change (shrink-ray) / light-&-shadow / weather (wind, rain
puddles) / co-op-style buttons in single-player / a rewind or ghost-of-yourself mechanic.**
(These are notes, not commitments — the point is the runway is long.)

---

## 4. Coherence guardrails (the standing rules)

1. **One new primitive per world** — remix the rest. (Prevents both repetition and soup.)
2. **Reuse engine state across worlds** — new mechanics should extend existing plumbing
   (`car.airT`, portals, respawn contract, patrol paths) before inventing new systems.
3. **Everything stays forgiving** — no game-over, quick respawn, celebratory. This is the
   game's soul; a mechanic that can hard-stuck or punish a 7-year-old is wrong by definition.
4. **Difficulty climbs *gently and monotonically*** — `rival.mult` never resets down a world;
   par curves step up a little each world; the *new kind* of challenge carries the interest,
   not raw punishment.
5. **Every world gets a doc + an identity card** — the longevity investment (Dad's standing
   ask). Future sessions read the card, not the code, to stay coherent.
6. **The comingSoon card teases the *next theme*** — a thread that pulls the player forward.

---

## 5. Build plan for the atmosphere layer (the concrete next step)

The one change that makes §1 real for every world:

- **World-aware ground palette.** Give `prerenderGround` a per-world `{ground, wall, glow}`
  lookup keyed off the level's world (`seriesOf(levelIx)`) with the current dark values as the
  default. Ice→pale blue-white deck, factory→steel/rust, water→aqua pool, space→indigo deck.
  ~1 lookup table + a few `fillStyle` swaps; **zero gameplay/geometry risk** (pure paint).
- **A backdrop layer.** Draw a world-aware background *behind* the maze (currently just a flat
  fill): starfield/nebula for space, drifting snow for ice, heat-haze for factory, caustic
  shimmer for water. Slow parallax off the camera. New but self-contained.
- **Retrofit incrementally.** Ship it with Space (which needs it most), then backfill BRAIN
  FREEZE (already close), water, factory, mayhem — one world's palette at a time, each a
  tiny, safe, high-impact commit.

**Recommendation:** build the atmosphere layer *as part of World 6*, so Space debuts the
deeper standard and the older worlds get upgraded in its wake. This is the highest-value way
to answer "do they really feel on-theme?" — and it compounds across the game's whole life.
