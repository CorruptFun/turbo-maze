# 🏎 Garage Showroom + Vehicle Stats — system reference (v4)

The garage rebuilt as a **Forza / Need-for-Speed–style showroom**: one hero car
on a lit turntable, a glance-able **spec card** (Performance Index + class +
stat bars), and a **big swipeable carousel** of every car/pet. Backing it is a
real **per-vehicle stat system** that gently shapes how each car drives.

Everything lives in the single `index.html`. This doc is the map — what the
system does, the exact numbers, and **where each piece hooks into the code** so
anyone (human or agent) can extend it without spelunking. Code is referenced by
**function name** (line numbers drift); search `index.html` for the banner
`GARAGE SHOWROOM (v4)` and the `vehicle stats` block.

> **Replaces** the old flat 4-column grid (`GARAGE SHOP (v3)`). Same coins, same
> ownership/save model, same buy/equip/pets/car-number features — new skin, new
> stat layer, plus swipe.

---

## 1. Player's-eye view

1. Tap **🛒 SHOP** on the world hub. The car you're riding stands on the turntable.
2. **Swipe** the carousel (or tap a tile, or the ◀ ▶ arrows) to browse. The hero
   car, name, spec card, and Performance Index all update to the highlighted car.
3. The **spec card** (bottom-left, translucent over the showroom) shows:
   - **PERFORMANCE** — a Forza-style index, **100–1000**.
   - A **class** letter **D · C · B · A · S** (tinted; S glows gold).
   - Four animated bars: **SPEED · ACCEL · GRIP · BOOST** (each 1–10).
4. The big button reads **EQUIP** / **✓ RIDING** / **BUY _n_ 🪙** /
   **NEED _n_ MORE COINS** / **🔒 BEAT [WORLD]** depending on the car's state.
   Buying is a **two-tap confirm** (button flips green → "TAP TO BUY!").
5. Toggle **🏎 CARS / 🐾 PETS** at the top. Pets have no stats — their card just
   says "COMPANION". **CAR #** (the roof decal, 0–99) sits above the button on
   the cars tab.

**The stats are real.** In the campaign, the car you equip actually drives to
its numbers — a high-SPEED car has a higher top end, high-GRIP corners tighter,
high-BOOST nitro lasts longer. The differences are **gentle** (see §4) and apply
to **your campaign car only** — VS / Knockout / Co-op stay perfectly fair (§5).

---

## 2. The four stats

Every car has four integer stats, **1–10**, baseline **5**.

| Stat | Bar label | Colour | Drives… |
|---|---|---|---|
| `spd` | SPEED | red `#ff6a5e` | top speed (`maxSp`) |
| `acc` | ACCEL | yellow `#ffd23b` | acceleration (`accel`) |
| `hnd` | GRIP  | blue `#7ec9ff` | cornering grip **and** steering rate |
| `bst` | BOOST | green `#9ae64a` | nitro economy (recharge + burn time) |

**Baseline 5 = ×1.000 on every multiplier**, so the free **ROCKET** (all 5s)
drives *exactly* like the pre-stats game, and any car missing from the table
falls back to the rocket baseline (`carStat()` → `CAR_STATS.rocket`).

### Performance Index & class (`carPI`, `carClass`)
```
PI    = (spd + acc + hnd + bst) × 25           // 100 … 1000
class = PI≥800 S · ≥700 A · ≥600 B · ≥450 C · else D
```
PI/class are **derived** from the four stats, so the badge and bars can never
disagree. Class tints live in `CLASS_COL` (S gold, A amber, B green, C cyan, D grey).

---

## 3. The roster (`CAR_STATS`)

Values are tuned for **personality** and **earned power** — paid cars are C/B,
world-reward cars are A, the secret goat is the lone S. Novelty cars are
*side-grades* (similar PI, opposite feel), so a bigger number ≠ "just better".

| id | Car | S | A | G | B | PI | Class | Feel |
|---|---|---|---|---|---|---|---|---|
| `rocket` | Red Rocket | 5 | 5 | 5 | 5 | 500 | C | the balanced baseline (free) |
| `taxi` | Turbo Taxi | 6 | 3 | 6 | 4 | 475 | C | heavy cab: planted, sluggish |
| `banana` | Banana | 5 | 7 | 3 | 6 | 525 | C | light & slippery, skates |
| `tractor` | Big Green | 3 | 4 | 9 | 3 | 475 | C | slow grip tank, unstoppable |
| `hotdog` | Glizzy GT | 6 | 6 | 5 | 6 | 575 | C | honest all-rounder |
| `cart` | Cart Racer | 4 | 8 | 7 | 4 | 575 | C | twitchy: darts & turns, no top end |
| `toilet` | Skibidi GT | 6 | 6 | 6 | 6 | 600 | B | meme mid, no weakness |
| `ufo` | The Saucer | 6 | 5 | 7 | 8 | 650 | B | hover: great grip + big nitro |
| `supra` | 2FAST | 8 | 7 | 6 | 6 | 675 | B | real sports car (top paid) |
| `beast` | The Beast | 8 | 6 | 6 | 7 | 675 | B | bruiser, big speed & boost |
| `blaze` | Blaze | 8 | 8 | 6 | 7 | 725 | A | 🏁 W1 reward — launch monster |
| `frost` | Frost GT | 7 | 7 | 9 | 7 | 750 | A | 🧊 W2 reward — ice-grip king |
| `wave` | Tidal Wave | 7 | 8 | 8 | 7 | 750 | A | 🌊 W5 reward — rides the currents |
| `glitch` | Glitch GT | 8 | 8 | 7 | 8 | 775 | A | 🌀 W3 reward — no weakness |
| `monster` | Crusher | 9 | 6 | 7 | 8 | 750 | A | 🏭 W4 reward — top-speed bruiser |
| `goat` | Golden Goat | 9 | 9 | 9 | 10 | 925 | S | 👑 secret — best overall, lone S |

> `spd`/`acc`/`hnd` are kept ≤ 9 and only **BOOST** may reach 10, so every
> difficulty-touching multiplier stays inside **±12%** — matching the crate
> upgrade ceilings. Adding a car? Add one row here; no stats entry → safe
> baseline. Keep reward cars **A** and the secret slot **S** to preserve the
> "clears feel earned" curve.

---

## 4. How stats become physics (`updateCar`)

Each stat maps to a multiplier that's **exactly 1.0 at stat 5** and stacks
**multiplicatively on top of** the crate upgrades (`mSpd/mGrip/mNit`) — it never
replaces them:

| Multiplier | Formula | Applied to | Range (stat 3→10) |
|---|---|---|---|
| `kSpd`  | `1+(spd-5)*0.020` | `maxSp` | 0.96 … 1.10 |
| `kAcc`  | `1+(acc-5)*0.024` | `accel` | 0.952 … 1.120 |
| `kGrip` | `1+(hnd-5)*0.030` | lateral `grip` | 0.94 … 1.15 |
| `kTurn` | `1+(hnd-5)*0.015` | `tRate` (steering) | 0.97 … 1.075 |
| `kNit`  | `1+(bst-5)*0.050` | nitro burn `/` + recharge `×` | 0.90 … 1.25 |

SPEED touches **only** `maxSp` and ACCEL **only** `accel`, so they never
double-count the crate `mSpd` (which legitimately hits both). GRIP drives both
cornering grip and steering rate (so it *feels* like handling, not just physics).

**Measured** (deterministic sim, `SPD=0.85`): rocket boost top ≈ **561**, goat
≈ **606** (×1.08), tractor cruise ≈ **326** vs rocket **340** (×0.96). Gentle by
design — the maze walls, not raw speed, remain the limiter.

**Worst-case stack** (goat + all crates maxed): speed ×1.21, accel ×1.23, grip
×1.37, nitro-recharge ×2.25 — grip/nitro were already at these magnitudes from
crates alone; +21% top speed is the intended fully-invested power fantasy and
stays winnable. If any late boss becomes a walkover, trim the `kGrip` slope
`0.030→0.025` / `kNit` `0.050→0.040` (data-only, no structural change).

---

## 5. Fairness gate (`carPerk`)

```js
function carPerk(car){
  if(car !== game.car) return false;                                  // player's car only
  if((game.vs||game.ko||game.coop) && !CONFIG.powerUpsInVs) return false;  // campaign only
  return true;
}
```
Mirrors `boosted()`'s multiplayer envelope but is **independent of the crate
toggle** — a car's handling character is core progression, so it applies even
with crates switched off. In `updateCar`, `const cs = carPerk(car) ?
carStat(store.car) : null;` — when `cs` is null every `k*` is 1, a **pure no-op**
for the rocket and for **all** VS/KO/co-op cars (rivals & P2 never satisfy
`car===game.car`). **Verified:** goat campaign 606 vs goat-in-VS 561 = rocket 561.

> ⚠️ Never read `store.car` stats off a car that isn't `game.car`. The whole
> fairness guarantee rests on the `carPerk(car) ? … : null` line.

---

## 6. Showroom UI — where things are drawn

`drawShop(dt)` (state `"shop"`) lays out **header + tabs → big STAGE → big
CAROUSEL → car-number → BUY** and dispatches to these helpers:

| Function | Draws |
|---|---|
| `shopHero(stage, sel, locked, isCars)` | spotlight, rotating turntable, the car (sway + bob; locked = dimmed silhouette + 🔒), name plate. Reserves bottom room for the spec card only on a **narrow** stage. |
| `shopSpec(stage, sel, isCars)` | the translucent corner **spec card**: PI + class chip + 4 compact animated bars (cars), or a "COMPANION" note (pets). |
| `shopStrip(r, roster, isCars)` | the **carousel** — centre tile biggest, neighbours shrink/fade with distance; locked cars show world-emoji + 🔒; equipped car gets a green dot. Writes `sh.strip` for the drag handler. |
| `shopNumber(r)` | the CAR # −/+ control (cars tab only; short label when narrow). |
| `shopBuy(r, btn)` | the auto-fit BUY/EQUIP button (pulses green while a purchase is armed). |
| `shopTab(...)`, `shopBtnState(...)` | tab pills; resolves the button's label/act/colour for a selection. |

**Responsive:** `land = W > H*1.2`. Landscape = full-width stage over a
full-width carousel, number + buy sharing the bottom row. Portrait = stage,
carousel, number, buy stacked (only the stage absorbs slack; floors keep the
hero ≥ 150 px). Both cover tall phones, short landscape phones, notches
(`safeT/safeB/PADX`), and wide desktop.

### Animation state (`sh`)
`const sh = { tab, sel, scroll, target, ptr, bars{}, pi, max, strip{} }`.
Per frame `drawShop` eases `sh.bars`→target stats, `sh.pi`→target PI, and
`sh.scroll`→`sh.target` (unless mid-drag) — so bars slide, the PI rolls like a
dyno, and the carousel spring-snaps. `shopSyncSel()` centres the carousel on the
equipped car on entry / tab switch.

---

## 7. Swipe / tap input

Canvas taps are pointer-**down** events; the shop overrides this so a drag can't
fire a button. Gated on `game.state==="shop"` in the touch/mouse handlers:

- **down** → set `sh.ptr = {x0,y0,s0:scroll,moved:false}` (no tap pushed).
- **move** → `shopDrag()`: >10 px = `moved`; horizontal-dominant drag scrolls
  `sh.scroll = s0 − dx/step`.
- **up** → `shopDragEnd()`: not moved → synthesize a tap at the press point
  (hit-tested next frame); moved → snap `sh.sel = round(scroll)`.

One 10 px threshold, identical for touch and mouse. `sh.ptr` is cleared on
`back` and on the mouse-up guard, so a drag can't leak into the next screen.
Selecting a **locked** car to preview its stats is allowed; only **buying** is
blocked — both by the `"noop"` button act **and** a `reward||secret` guard at the
top of the buy path in `shopAction`.

---

## 8. Extending

- **New car:** add to `VEHICLES`, a `drawVehicleBody` case, and a `CAR_STATS`
  row (skip the row for a safe baseline). Reward cars: set `reward:"id"` on the
  `SERIES` entry (the strip/button auto-show "🔒 BEAT [world]" until earned).
- **Re-tune balance:** edit `CAR_STATS` numbers, or the five `k*` slopes in
  `updateCar`. Re-run the deterministic top-speed sim (see §4) to sanity-check.
- **New pet:** add to `PETS` (id, name, price, emoji). No stats needed. Optional
  **composed-pet** fields (see `drawPetGuy`, used by the follower, victory screen
  and turntable): `hat:"🍓"` (small emoji worn up-right), `num:"67"` (bold decal
  over the body), `fx:"diamond"` (time-driven sparkle twinkles, pause-safe).
  The 🇮🇹 Brainrot Pals (fragolina/sharko/crocco/gatto/dolfino/diamante) are the
  reference set. **Naming rule:** brainrot-style content is always ORIGINAL
  characters in the meme spirit — never literal Roblox roster names (house BRIEF).

## 9. Regression guards (what to re-check after edits)

1. **Fairness** — equip the goat, run a VS race: rival & P2 must stay baseline.
2. **Locked buy** — select an unearned reward/secret car: BUY must bonk, never grant.
3. **No double-count** — SPEED→`maxSp` only, ACCEL→`accel` only (5 changed lines).
4. **Short screens** — portrait H 568/667/812 and landscape H 320/380/460 with a
   fat notch: hero > 0, nothing clips, `land` engages before the hero collapses.
5. **Drag vs tap** — a swipe never triggers BUY; a stationary tap always selects.
