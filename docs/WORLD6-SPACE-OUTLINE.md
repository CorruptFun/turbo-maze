# 🌌 WORLD 6 — SPACE (design outline, draft)

> Status: **outline / pre-decisions.** Captures the vision + options; we firm it up once
> Dad picks a direction, then a design workflow → build (same flow as World 5).
> The roadmap throughline: World 5's splash-pad **airborne state (`car.airT`) is reused here**.

---

## The one special thing: **GRAVITY**

Every mechanic in the game so far is a **wall** (blocks you), a **floor** (changes friction
or shoves you), or a **launch** (one impulse). Space introduces something genuinely new:
**a continuous force that BENDS your racing line.** Nothing else in the game pulls you.
That's the "unique and special" — and it's the most *space* thing imaginable.

### 🪐 Gravity wells (planets)
A planet sits in the track with a **pull radius**. Drive near it and you're gently tugged
toward it; the closer you get, the stronger the tug. Two ways to play it:
- **Slingshot** — swing around a planet to *whip* around a corner and fling out faster
  (a flow/skill moment — magical for a kid: "I flew around the planet!").
- **Get caught** — ignore it and you spiral inward; the planet's core is solid, so worst
  case you **bump off it** (forgiving — a bonk, never a death).
Tuned gently: normal driving always escapes the pull. It's "a current toward a point,"
not a trap.

### 🕳️ Black holes → 🌀 wormholes (the dramatic twin)
A black hole is a planet's stronger cousin. Cross its **event horizon** and you get sucked
into a cinematic spiral → shot out of a paired **white hole** across the map (space portals,
but with a *pull* that makes them feel alive). Forgiving: you don't lose anything, you get
*warped*. (This reuses the existing portal pairing + the airborne/respawn plumbing.)

---

## The feel: **low-gravity drift** 🌠

The whole world is **floaty** — less friction, momentum carries, long luxurious drifts. The
moment you start a Space level it *feels* different (like ice, but everywhere and gentler).
Two ways to dose it (a fork for Dad — see questions):
- **Gentle global floatiness** — the whole world is a bit floaty (recommended: ~30% less
  grip, so it's dreamy but a 7-year-old stays in control).
- **Zero-G zones** — floaty only on marked ⭐ tiles, normal grip elsewhere (a toy, not a
  constant).

---

## Traversal: **the void + booster rings** (this is where `car.airT` comes back)

- **The void** 🕳️ — in space, off-track isn't a wall, it's *empty space*. Drift off a
  platform edge and you float into the void → **gentle respawn** (reuses the foam/trap-door
  respawn). Space mazes are **islands floating in the black**. (Fork: whole-level islands
  vs. void only at specific chasms — see questions.)
- **🚀 Booster rings / launch pads** — fly through a ring and get a big directed thrust /
  **airborne leap** across a void gap. **This is the splash-pad airborne code reused** —
  exactly the "bounce pads get you ready for Space" throughline. In space they're
  rocket-boosters and warp-rings.

---

## Co-signature: ☄️ asteroids (drifting debris) — CONFIRMED

Free-floating rocks that drift/tumble across the track — timing dodges, reusing the factory's
sliding-crusher / patrol pattern reskinned as space debris. Dad wants gravity **and** asteroids
**together**, and they're one coherent idea: gravity is the *flow/feel* signature, asteroids are
the *reflex* one — and they combine (an asteroid caught in a planet's pull = a moving hazard on
a *curved* path). The unifying theme: **in space, everything is in motion, under a force.**

---

## Space flavor (cheap reskins, big vibe)
Coins → ⭐ **stars** · nitro → 🚀 **thrusters** · goobers → 👽 **aliens** · the boss rival →
the goober in a **UFO / rocket** · ice → **frozen comet trails** · boost pads → **hyperspace
strips**. All art/label swaps on existing mechanics.

---

## Making Space FEEL like space (the atmosphere layer)

Dad's key note: our worlds are *themed* but don't always **feel** on-theme — BRAIN FREEZE
nails it (blue + ice everywhere), the rest are "default game + themed mechanics." The root
cause: **every world currently shares one dark-asphalt ground + orange lamp-pools** in
`prerenderGround`; theming lives only in the accent `hue` + mechanic art. Space is where we
fix that and set the pattern for every future world:
- **Palette** — deep indigo/violet ground, near-black walls, star-white + cyan accents
  (hue ~`#7b6cff`). Owns a color the way ice owns blue.
- **Backdrop** — a slow-parallax **starfield + nebula wash** behind the maze (a new,
  reusable *world-aware background layer*).
- **Ground** — reads as a metallic **space-station deck / asteroid crust**, not asphalt;
  the warm lamp-pools become soft **star glows**.
- **Set dressing** — a distant planet or two, a drifting satellite, twinkles.

This "atmosphere layer" is a **systemic** upgrade (world-aware ground + backdrop) that
elevates *every* world, not just Space — see **[WORLD-DESIGN-SYSTEM.md](WORLD-DESIGN-SYSTEM.md)**.

## Reward car
**COMET** ☄️ (id `comet`) — a low sleek racer with a glowing star-trail. (Alts: NOVA GT,
STARDUST, METEOR.) Slots into the garage showroom stats like TIDAL WAVE did.

---

## Rough 15-level arc (75–89) — *sketch, tune after direction is set*
Teach each toy solo → combine → bosses. Difficulty: the **brainiest world yet but still
forgiving** — gravity is a *new kind* of challenge (spatial/momentum), not just "harder,"
so it stays fresh. Golden Goat auto-moves to the final level (89).

| # | Name | Teaches |
|---|---|---|
| 75 | LIFT-OFF | void + booster-ring launch |
| 76 | MOON WALK | low-gravity floaty drift |
| 77 | FIRST ORBIT | one gravity well — the slingshot |
| 78 | SPACE JUNK | asteroids (if included) |
| 79 | WORMHOLE | black hole → white hole warp |
| 80 | SLINGSHOT | chain two gravity whips |
| 81 | ASTEROID BELT | dodging + gravity together |
| 82 | THE VOID | open-space islands, booster leaps |
| 83 | TWIN PLANETS | thread between two competing pulls |
| 84 | METEOR SHOWER | asteroids + wormholes |
| 85 | COMET CHASE | **BOSS** race (rival ~2.25) |
| 86 | DARK SIDE OF THE MOON | dark + gravity |
| 87 | ZERO-G ZONE | full floaty showcase |
| 88 | GALAXY SPRINT | everything at once |
| 89 | SUPERNOVA | **FINALE BOSS** (rival ~2.4) + 🐐 Golden Goat |

---

## Locked direction (Dad, 2026-07-15)
1. **Signature = 🪐 gravity + ☄️ asteroids** (both) — unique but still *our game*; not so
   out-there it stops feeling like Turbo Maze.
2. **World feel = gently floaty everywhere** — dreamy low-G, kid stays in control.
3. **The void = only at chasms** — mostly solid tracks with gaps you launch across; forgiving.
4. **Name = COSMIC RUSH** (Dad, locked).
5. **Boss rival drives the 🛸 UFO** (alien boss in a flying saucer — perfect).
6. **Reward car = the UFO** ("beat the alien → take its saucer" — great for a kid). ⚠️ *Flag:*
   the UFO is currently a **paid shop car** (`ufo`, ~mid-price). To make it the free World-6
   reward we either (a) move it out of the paid shop → it becomes earn-only (cleanest, but a
   kid saving coins for it loses that option), or (b) keep it buyable **and** grant it free on
   beating the world (a saver who already bought it just keeps it — mild redundancy). Recommend
   (b) for least disruption to live saves, or make the reward a **distinct "UFO / MOTHERSHIP"
   variant** so the paid UFO stays intact. Decide at World-6 build time.

The bigger point Dad raised (worlds themed but not always *feeling* on-theme; keeping the
whole growing game coherent) spun off its own doc: **[WORLD-DESIGN-SYSTEM.md](WORLD-DESIGN-SYSTEM.md)**.
Space is the first world designed to that deeper standard.

## Build notes (for when greenlit)
- New force math: a per-frame pull toward each well `F ∝ 1/dist` (clamped, escapable),
  applied to `car.vx/vy` in `updateEntities` — a brand-new *field* primitive (all prior
  mechanics are cell-state, not fields).
- Low-G = a per-world friction/grip scalar (like the sticky/ice reads, but world-wide).
- Booster rings + the void reuse `car.airT` + the trap-door/foam respawn contract.
- Black-hole warp reuses the portal pair + a pull-in animation.
- Maze variety: gravity wells & black holes are point positions → they mirror/rotate for
  free (non-directional), like the World 5 tiles.
