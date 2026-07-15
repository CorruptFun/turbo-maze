# 🌊 SPLASH ZONE — World 5 (mechanics + code map)

World 5 is the **water park**. It adds **three new movement toys** and re-themes two
existing mechanics, on a *gentle* step up from World 4 (the factory). The design bet:
for a 7-year-old who already finds it "intense enough," fresh **toys** beat more
difficulty. Two of the toys are also deliberate on-ramps to future worlds (see
[§8 Roadmap](#8-roadmap-hooks)).

> One-file game: everything below lives in [`../index.html`](../index.html). Line
> numbers drift, so this doc maps by **function and field name** (grep them). The
> tile validator lives in [`../tools/validate-levels.js`](../tools/validate-levels.js).

---

## 1. Player's-eye view

- 🟠 **Splash pads (`J`)** — drive onto one and you get **flung into the air**: the car
  hops ~2.4–3.1 cells the way it's pointing, sailing *over* walls, gaps, and hazards,
  then lands with a splash. It's the game's first "jump."
- 🟣 **Sticky shallows (`&`)** — murky teal water that's the **opposite of ice**: slow
  and planted. Never a hazard, just a wade. Nitro **punches through** it — the deliberate
  "hit boost to power through the goop" teaching moment.
- 🧱 **Foam floats (`%`)** — a tile that **sinks a beat (~0.9s) after you touch it**. Cross
  it while moving; loiter and it drops you in the water (quick respawn, no game-over).
- 🌊 **Water currents** = the existing conveyor tiles `< > ^ v`, re-themed.
- 🛝 **Waterslides** = the existing ice tile `~`, re-themed.

Reward for beating the world: the **TIDAL WAVE** car (id `wave`).

---

## 2. The three tiles

| Char | Name | Class | Directional? | Runtime state |
|---|---|---|---|---|
| `J` | 🟠 splash / bounce pad | passable floor | No — flings along `car.heading` | pad cooldown only |
| `&` | 🟣 sticky shallows | passable floor | No — scalar grid | none (static tint) |
| `%` | 🧱 foam float | passable floor → hole | No — position only | `intact → cracking → gone` |

All three are **non-directional**, so maze-variety mirror/rotate carries them for free
(no `swapDirs`/`transformLevel` work — only the currents `< > ^ v` are directional and
those were already handled). None collides with the in-use alphabet.

---

## 3. 🟠 Splash pads — a reusable *airborne* state

The hop reuses the **exact pattern the 👻 ghost power-up uses**: while a timer is > 0 the
sub-stepped move loop **skips `collideWalls`**, so the car flies through walls/gaps.

- **State:** `car.airT` (seconds of airtime left) + `car.airMax` (the airtime it launched
  with, so the render parabola normalizes for any airtime). Added to the `newCar` literal.
  `game.bounces = [{c,r,x,y,ph,cool}]` parsed from `J` in `startLevel`.
- **Launch** (`updateEntities`, the `game.bounces` block, inside the per-car loop so
  car + car2 both hop, and the boss rival — which isn't in `game.cars` — never does):
  fires only when grounded (`car.airT<=0`, `bp.cool<=0`). Velocity is set to
  `clamp(speed + 300, 480, 620)` along `car.heading` (never a dud, never a rocket), and
  `car.airT = car.airMax = 0.55`.
- **Fly-over** (`updateCar` move loop): the collision call is gated
  `&& !(car.airT>0)` right next to the ghost gate.
- **Hazard-skip** (`updateEntities`): while airborne the car ignores boost pads,
  conveyor shove, **trap-door fall**, **goober steal**, **crumble arm/fall**, and **KO
  pits** — every fall/steal trigger carries a matching `car.airT<=0` / `!(car.airT>0)`
  guard. *(If you add a new hazard, add the same guard or a hop will "fly then instantly
  fall.")*
- **Splashdown** (`updateCar`, right after the `ghostT` decrement): when `airT` crosses
  to 0 → squash, particles, sound. **Safety net:** if the landing cell is `isSolid`, the
  car **snaps to the nearest open cell** (3-cell search, falls back to `car.spawn`) so a
  hop into a thick wall can never get stuck. *(Authoring still aims landings at floor;
  this is the backstop.)*
- **Render:** `drawBounce()` (pulsing ring + gradient dome + white chevrons). The airborne
  **lift** is in `drawCar` (between the underglow and `ctx.rotate`): a 0→1→0 sine parabola
  raises the body up to 30px screen-up, scales it up, and shrinks/separates the ground
  shadow.

**Authoring rule:** the landing zone (2–3 cells past a `J` in the travel direction) must
be **open floor**. Hops are a shortcut/flourish, **never the only way past a wall**.

---

## 4. 🟣 Sticky shallows — the inverse of ice

`game.sticky[r][c]` is a per-cell scalar grid parallel to `game.slick` (ice), parsed from
`&`. Read once per frame in `updateCar` as `onSticky` (which is **forced off while
airborne**, so a hop sails over goop). It bends four physics terms:

| Term | Normal | On `&` |
|---|---|---|
| top speed (`maxSp`) | 400 cruise / 660 nitro | ×0.6 = **240** cruise / ×0.8 = **528** nitro (nitro punches through) |
| accel | 750 | ×0.7 = 525 (heavy but responsive) |
| grip | 8.5 | **11** (planted — goop never spins a kid out) |
| coast drag | 2.2 | **5.5** (bleeds speed fast so you stop before coasting into a hazard) |

**Escape guarantee (proven, not tuned):** throttle-on-goop terminal ≈ 525/1.6 ≈ 328 > the
240 cap, and nitro terminal ≈ (1300·0.7)/1.6 ≈ 569 > the 528 cap — holding the stick always
reaches the cap even fully surrounded by `&`. **Sticky can never trap.** Entering the
shallows above 120px/s pops a "SPLASH!" (the `car.wasSticky` edge). Rendered in
`prerenderGround` as a murky-teal tint + concentric ripples (visually *opposite* to ice's
pale diagonal sheen). Composes on top of the per-vehicle stat multipliers
(`kSpd`/`kAcc`/`kGrip`) — goop just scales whatever the car's handling already is.

---

## 5. 🧱 Foam floats — collapse-behind-you

`game.crumbles = [{c,r,x,y,state,t0,ph}]` parsed from `%`; **never** pushed into
`game.trapDoors` (keeps trap-door scans clean). Lifecycle:

- `intact` → first car contact (in `updateEntities`, **not** invuln-gated — a tile must
  start cracking even right after a respawn) sets `state="cracking"`, `t0 = game.gt`.
- `cracking` → after `CRUMBLE_GRACE` (0.9s, a `game.gt` timestamp latch so it's
  car-count-independent in co-op/VS/KO) the **once-per-frame collapse flip** (outside the
  per-car loop) sets `state="gone"`.
- `gone` → a car centered on it **falls** (invuln-gated, `blockHit` lets 🛡️/👻 save you),
  respawning at `car.spawn` — the **exact trap-door respawn contract**. "Still on it when
  it collapses" happens naturally: next frame the center-on-`gone` test fires the fall.

Deterministic and forgiving: 0.9s ≈ 3× the ~0.28s it takes to cross a cell at cruise, so a
moving car always clears one. **Render** `drawCrumble()`: intact bob → amber crack
telegraph (deterministic crack pattern, jitter ramps as it nears collapse) → aqua
splash-hole (distinct from the purple trap-door hatch). Foam resets to `intact` every
level load.

**Authoring rule:** foam is a shortcut/flourish, **never the sole S→F bridge** (after it
collapses a kid would respawn stranded). The validator **hard-errors** a `%`-only bridge.

---

## 6. Interaction / regression matrix

| Mechanic | Maze variety | Boss rival | Golden crate | Validator | Co-op/VS/KO | prerenderGround |
|---|---|---|---|---|---|---|
| Splash `J` | free (non-directional) | no hop (rival not in `game.cars`); never the sole route | **excluded** (can't stop on a trampoline) | passable | both cars hop; unknown char = walkable → no crash | untouched (per-frame art) |
| Sticky `&` | free | slows rival symmetrically; not a wall/timing block | not excluded (safe road) | passable | all cars slow uniformly | **baked** (static tint) |
| Foam `%` | free | **avoided** (added to the rival's `trapAvoid` set, with the existing unavoidable-fallback; boss corridors authored foam-free) | **excluded** (vanishing floor) | passable + **hard-error** sole-bridge check | per-*tile* state → fair shared collapse; each car respawns at its own `car.spawn` | untouched (per-frame, stateful) |

The stuck-hint arrow's BFS treats all three as passable road, so it routes over them fine.

---

## 7. The reward car — TIDAL WAVE

- `VEHICLES`: `{ id:"wave", name:"TIDAL WAVE", price:0, trail:()=>"#25d4e0", reward:true }`.
- `SERIES[4].reward = "wave"` grants it on beating the world (`levelClear` / `_seriesEnd`),
  and the existing load-time reconcile back-grants it to saves that already beat World 5.
  Locked in the shop until earned (`🔒 BEAT SPLASH ZONE`).
- `CAR_STATS.wave = {spd:7, acc:8, hnd:8, bst:7}` (a nimble all-rounder, class A) — plugs
  into the garage showroom stat system.
- Art: `drawVehicleBody` `vid==="wave"` branch (a cresting-wave hull, turquoise, droplet
  accents), turquoise `#25d4e0` deliberately distinct from FROST's pale blue.

The 🐐 Golden Goat unlock auto-relocates to the new final campaign level (it keys off
`game.levelIx === LEVELS.length-1`), so appending the world moved it to L74 for free.

---

## 8. Roadmap hooks

- **Splash pads → World 6 (Space).** `car.airT`/`car.airMax` were named generically on
  purpose: a low-gravity "floaty" mode can reuse the same airborne machinery (skip
  collision, parabola render, drag rules) rather than inventing a new one.
- **The 🔥 lava-sweep** ("outrun the wall") hazard is reserved for a later **lava** world,
  not built here (per the roadmap: Water → Space → Lava).

---

## 9. Tuning knobs (all single-token, safe to tweak)

| Knob | Where | Value | Effect |
|---|---|---|---|
| launch clamp | `updateEntities` bounces | `480–620` | hop distance floor/ceiling |
| airtime | `updateEntities` bounces | `0.55` | how long/high the hop is (Space will crank this) |
| airborne cap | `updateCar` `maxSp` | `×1.6` | must stay ≥ launch max (keeps the arc from clamping dead) |
| sticky caps | `updateCar` `maxSp` | `×0.6` / `×0.8` | goop cruise / nitro top speed |
| sticky grip | `updateCar` `grip` | `11` | how planted the goop is |
| sticky drag | `updateCar` `fwd` | `1.6` / `5.5` | throttle / coast bleed on goop |
| `CRUMBLE_GRACE` | top-level const | `0.9` | foam fuse seconds |

---

## 10. Off-switch / revert

There's no master CONFIG flag for the world (it's content, not a feature toggle). To pull
it, revert the SPLASH-ZONE commit, or remove the `SPLASH ZONE` entry from `SERIES` and the
15 `LEVELS[60..74]` (worlds only *group* level indices, so removing them renumbers nothing
and saved progress is untouched). The three tiles are inert on any level that doesn't use
them (empty `game.bounces`/`game.crumbles` and an all-zero `game.sticky` are fast no-ops).

---

## 11. The 15-level arc (LEVELS 60–74)

Teaching order: exciting toy first (splash) → sticky → foam → remix; currents & waterslides
re-enter mid-world; bosses at 70 & 74, dark beat at 71. Par ramps 36→84 — a *soft* step over
the factory (34→80). Every level is ground-solvable with no hop and all `%` as holes (validator
enforced); both boss corridors are foam-free.

| # | Name | Focus | Par | Flags |
|---|---|---|---|---|
| 60 | 🟠 CANNONBALL! | teach `J` splash solo — fling over a wall | 36 | |
| 61 | 🩴 SHALLOW END | teach `&` sticky solo — muddy shortcut vs clean road | 40 | |
| 62 | 🧽 FOAM FLOATS | teach `%` foam solo — one bridge + a safe ledge | 42 | |
| 63 | 💦 SPLASH & DASH | boost `*` → `J` sails over a goober onto nitro | 46 | goober |
| 64 | 🌊 CURRENT AFFAIRS | currents `<>` serpentine + `&` brakes | 48 | directional |
| 65 | 🛝 WATERSLIDE! | `J` launches onto a long `~` slide | 52 | |
| 66 | 🪨 STEPPING STONES | `%` floats + a `J` skip; parallel safe route | 50 | |
| 67 | 🗝️ KEY LAGOON | key/door + `&` + gentle current, ring maze | 56 | key, directional |
| 68 | 🚣 THE RAPIDS | current → slide → thread `%` at speed; lazy-river ground route | 58 | directional |
| 69 | 🤿 DEEP END | all three toys woven together, multi-route | 56 | |
| 70 | 🏄 THE LIFEGUARD | **BOSS** + currents + a `J` shortcut; rival lane foam-free | 52 | `rival 1.95` |
| 71 | 🌙 NIGHT SWIM | **dark** + slides + `J` + foam that glows in the dark | 58 | `dark`, directional |
| 72 | 🌊 WAVE POOL | the signature churn: strong currents + `&` + `%`, open multi-route | 64 | directional |
| 73 | 🚧 SPILLWAY | all-toys gauntlet + key/door, no rival | 68 | key, directional |
| 74 | 🐙 TIDAL TITAN | **FINALE BOSS** + full showcase; hosts the 🐐 Golden Goat; rival corridor foam-free | 84 | `rival 2.12` |
