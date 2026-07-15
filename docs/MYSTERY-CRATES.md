# 🎁 Mystery Crates — system reference (v1)

The garage's **crate / upgrade / power-up** economy. This is the "collect &
unlock, numbers-go-up" layer inspired by the collect-a-roster games (Steal a
Brainrot / Grow a Garden) — but built from **original mechanics**, no meme IP.

Everything here lives inside the single `index.html`. This doc is the map: it
explains what the system does, the exact loot tables, the save-data model, and
**where every piece hooks into the code** so anyone (human or agent) can extend
it without spelunking. Code is referenced by **function name** (line numbers
drift); search `index.html` for the banner `🎁 MYSTERY CRATES (v1)`.

> **Scope.** v1 = crates you buy in the garage. **v2** (not built yet) = rare
> glowing crates that spawn *inside levels* and pop when you smash them. The
> loot/grant code is already reusable for v2 — only a spawner + an in-level
> smash hook are missing (see [v2 notes](#v2--in-level-crates-not-built-yet)).

---

## 1. Player's-eye view

1. Tap **🎁 CRATES** on the world hub (next to 🛒 SHOP).
2. Spend coins on a crate → a **reveal** animation rolls a **rarity**, then a reward.
3. Rewards land in four buckets:
   - **Upgrades** — permanent tiny bumps to your car (kept best-of-each).
   - **Power-ups** — one-use; **arm ONE** before a race, it fires automatically.
   - **Cosmetics** — pure looks (trail colour, sparkle shine, a topper emoji).
   - **Currency** — bonus coins / aura so no pull feels empty.
4. Upgrades & power-ups only affect the **human's campaign car**. VS / Knockout /
   Co-op stay fair unless you flip `CONFIG.powerUpsInVs`.

---

## 2. The crates

| Crate | Price | Rarity odds `[C, R, E, L, S]` | Notes |
|---|---|---|---|
| 🎁 **Mystery Crate** | **100** | `[54, 27, 12, 6, 1]` | the everyday pull |
| 🎉 **Mega Mystery Box** | **200** | `[0, 50, 30, 15, 5]` | never junk (no common); 5× the Secret chance |

Defined in the `CRATES` object. `odds` are **relative weights** (they happen to
sum to 100, but `rollTier()` normalises, so they don't have to).

Rarity roll happens **first** — that's the suspense — then a reward is picked
from that tier's pool.

---

## 3. Rarity tiers

`RARITY` array, index `0..4`:

| # | Tier | Colour |
|---|---|---|
| 0 | COMMON | `#9aa4bd` |
| 1 | RARE | `#5bc0ff` |
| 2 | EPIC | `#b06ee8` |
| 3 | LEGENDARY | `#ffb742` |
| 4 | SECRET | `#ff5db1` |

---

## 4. Loot bucket A — Upgrades (permanent)

`CRATE_UPG`. You **keep the best of each stat** — a higher-tier pull replaces the
lower one, no loadout screen. `mult` is indexed by tier: **index 0 = none**,
`1..5 = common..secret`. Design rule: stats that touch difficulty (engine, grip)
bump **small**; feel-good stats (nitro, magnet) bump **big**.

| Stat | Emoji | tier1 | tier2 | tier3 | tier4 | tier5 | What it multiplies |
|---|---|---|---|---|---|---|---|
| `engine` | 🔧 | +2% | +4% | +6% | +9% | +12% | top speed (`maxSp` + `accel`) |
| `grip` | 🛞 | +3% | +6% | +10% | +15% | +22% | lateral grip (drift regain + ice) |
| `nitro` | ⚡ | +10% | +20% | +35% | +55% | +80% | nitro drain↓ & regen↑ |
| `magnet` | 🧲 | +12% | +25% | +40% | +60% | +90% | coin pull radius (base 95px) |
| `lucky` | 💰 | +3% | +6% | +10% | +16% | +25% | bonus coins banked |

**Where they apply** (all gated by `boosted(car)` — see §8):
- `engine` / `grip` / `nitro` → computed once at the top of `updateCar()` as
  `mSpd` / `mGrip` / `mNit`, then folded into `maxSp`, `accel`, the `grip`
  term, and the two `car.nitroMeter` lines.
- `magnet` → `magR` in the coin loop of `updateEntities()` widens the attract range.
- `lucky` → a fractional accumulator (`car.luckyAcc`) in the same coin loop that
  banks a bonus coin once it crosses 1.0. Only the **bank** is inflated;
  `car.coins` (the run's star/steal counter) stays honest.

Duplicate protection: if an upgrade rolls a stat you already own at that tier or
better, `grantDrop()` pays out coins instead (`20 × tier`).

---

## 5. Loot bucket B — Power-ups (one-use)

`POWERUPS`. **Arm exactly one** at a time (`store.armed`) on the crates screen;
it fires automatically during the run. `rarity` = the tier it drops in.

| Id | Emoji | Drops at | Effect | Fires when |
|---|---|---|---|---|
| `rocket` | 🚀 | common | full nitro off the line | run start |
| `double` | ✌️ | rare | 2× coins banked this run | run start (whole run) |
| `shield` | 🛡️ | rare | negate the next hit | on a trap-door / goober hit |
| `freeze` | ❄️ | epic | freeze all goobers ~4s | a goober comes within 150px |
| `ghost` | 👻 | epic | phase through walls + ignore the next hit ~2s | on the next hit |
| `slowmo` | ⏱️ | legendary | bullet-time ~2.5s | near a crusher / close goober |

### Lifecycle (see the "power-up run lifecycle" helpers)
- **`armRun()`** — called once at the end of `startLevel()`. Clears last run's
  flags, then, if power-ups are allowed and one is armed:
  - `rocket` / `double` fire immediately and are **consumed now** (they always help).
  - `shield` / `freeze` / `ghost` / `slowmo` are stashed on `car.pu` and fire
    **reactively**. They're only consumed **when they actually trigger** — so an
    unused one carries over to your next race. (Kind to a 7-year-old.)
- **`consumeArmed()`** — decrements `store.powerups[id]`; when it hits 0 the id
  is removed and `store.armed` is cleared (otherwise it stays armed, so a stack
  of 3 shields auto-re-arms each race).
- **`blockHit(car, x, y)`** — the shared "eat the next hit" gate. Called from the
  trap-door check and the goober-yoink branch in `updateEntities()`. Returns
  `true` (and fires shield/ghost) when a hit is absorbed.
- **`firePU(kind, x, y)`** — consume + float text + sound + puff for a reactive fire.
- Freeze & slow-mo **proactive triggers** live in `updateEntities()` right after
  the crusher update (they need to see goober/crusher positions).

### Slow-mo internals
Slow-mo scales the **gameplay `dt`** in the `tick()` play branch
(`gdt = dt*0.45`) and advances a separate gameplay clock **`game.gt`**. Crushers
read `game.gt` (not `game.t`), so they slow down too — without touching menus,
FX, or the real-time countdown. `game.slowmo` counts down in **real** seconds.

### HUD
`drawHUD()` shows a small badge (below the coins panel) with the armed power-up's
emoji so the kid knows what's ready; it blinks while a ghost phase is active.

---

## 6. Loot bucket C — Cosmetics (pure looks)

`COSMETICS`. Collected into `store.cosmetics[]`; equip one via `store.cosmetic`
(tap **WEAR** on the crates screen). No gameplay effect. Only shown on the
**player's** car (`!car.p2`).

| Id | Emoji | Drops at | `kind` | Renders as |
|---|---|---|---|---|
| `trail_flame` | 🔥 | rare | `trail` | orange motion trail (`cosTrail()`) |
| `trail_rainbow` | 🌈 | epic | `trail` | hue-cycling motion trail (`cosTrail()`) |
| `shine_gold` | ✨ | legendary | `shine` | gold sparkles around the car (in `drawCar()`) |
| `topper_goat` | 🐐 | secret | `topper` | emoji bobbing above the car (in `drawCar()`) |
| `topper_crown` | 👑 | secret | `topper` | emoji bobbing above the car |

Cosmetics already owned are **excluded from the pool** (`poolForTier()`), so you
never pull a duplicate look — a dupe would instead fall to another reward.

---

## 7. Loot bucket D — Currency (filler)

`CURRENCY` — keeps common pulls feeling like progress.

| Id | Emoji | Drops at | Gives |
|---|---|---|---|
| `pouch` | 🪙 | common | +25 coins |
| `sack` | 💰 | rare | +100 coins |
| `auraB` | 💫 | common | +15 aura |

---

## 8. Save-data model (`store`)

New fields on the `store` literal (all **default-safe**: the loader does
`Object.assign(store, JSON.parse(saved))`, so an old save simply keeps these
defaults and nothing breaks or renames):

```js
upg:      { engine:0, grip:0, nitro:0, magnet:0, lucky:0 }, // best tier owned per stat (0 = none)
powerups: {},        // { id: count } — one-use stock
armed:    null,      // id of the armed power-up, or null
cosmetics:[],        // owned cosmetic ids
cosmetic: null,      // equipped cosmetic id, or null
cratesOpened: 0,     // lifetime: crates bought in the garage
goldenFound: 0,      // lifetime: free golden crates smashed in levels (v2)
goldTaken:   {},     // { levelIx: 1 } — levels whose one-time golden crate is already collected
```

Per-run fields set on `game.car` (not persisted): `dbl`, `shield`, `pu`,
`ghostT`, `luckyAcc`. Per-run globals: `game.slowmo`, `game.gt`, `game.gold`
(the golden crate this run, or null) and `game.goldReveal` (its banner, or null).

**Which gate controls what** (the audit corrected a common assumption):
- **Upgrades** funnel through **`boosted(car)`** — `true` only for `game.car` in a
  campaign run (unless `CONFIG.powerUpsInVs`), and `false` when `upgOn()` is off.
- **Power-ups** are gated only at **`armRun()`** (they never touch `boosted`).
- **Cosmetics** gate at `cosTrail()` / the `drawCar` block via `cosOn()`.

---

## 9. Code map (search these names in `index.html`)

| Area | Names |
|---|---|
| Data tables | `RARITY`, `CRATES`, `CRATE_UPG`, `POWERUPS`, `COSMETICS`, `CURRENCY` |
| Roll / grant | `rollTier`, `poolForTier`, `grantDrop`, `openCrate` |
| Helpers | `upgMul`, `boosted` |
| Power-up lifecycle | `armRun`, `consumeArmed`, `blockHit`, `firePU`, `puFloat` |
| Cosmetic render | `cosTrail` + the cosmetic block at the end of `drawCar` |
| Screen | `drawCrates`, `crateCard`, `upgChip`, `puChip`, `cosChip`, `drawReveal`, `cratesAction`, `sectionLabel` |
| Physics hooks | `updateCar` (mSpd/mGrip/mNit), `updateEntities` (magR/lucky/double, freeze & slow-mo triggers, blockHit, golden-crate grab), `tick` (slow-mo `gdt` + `game.gt`) |
| Golden crates (v2) | `spawnGolden`, `grabGolden`, `drawGold`, `drawGoldReveal`; `game.gold` / `game.goldReveal`; `CRATES.golden`; spawn call + reset in `startLevel`; draw in `drawWorld`; grab in `updateEntities` |
| Toggles | `upgOn` / `puOn` / `cosOn` helpers; `CONFIG.cratesEnabled` + `cratesUpgrades` / `cratesPowerups` / `cratesCosmetics` |
| Nav wiring | hub `gbtns` (master-gated `🎁 CRATES` button) + its handler; the `state==="crates"` dispatch + normalizer in `tick()`; `armRun()` + `spawnGolden()` calls in `startLevel` |
| Config | `CONFIG.powerUpsInVs`, `goldenCrateChance`, and the 4 `crates*` toggles (all in the 🔧 TWEAK ZONE) |

---

## 10. Tuning knobs (safe to change)

- **Crate prices / odds** → `CRATES`.
- **Upgrade strength** → `CRATE_UPG[...].mult` (keep engine/grip gentle to
  preserve the obby challenge).
- **Secret rarity** → the last number in each crate's `odds` (`1` ≈ 1-in-100 on
  the Mystery Crate; raise it if he should hit big pulls sooner).
- **Add a power-up** → add to `POWERUPS` with a `rarity`, then handle it in
  `armRun()` (start-fire) or `blockHit`/`firePU` + a trigger (reactive).
- **Add a cosmetic** → add to `COSMETICS` with a `kind` already handled
  (`trail` / `shine` / `topper`) and it renders for free; a new `kind` needs a
  branch in `cosTrail`/`drawCar`.
- **VS fairness** → `CONFIG.powerUpsInVs` (`false` = campaign-only, the default).
- **Golden-crate frequency (v2)** → `CONFIG.goldenCrateChance` (default `0.3` ≈
  ~30% of levels deterministically carry a one-time golden crate; `0` = off,
  `1` = every level). Which levels is stable (`goldenHash`), and each is a
  one-time grab (`store.goldTaken`).
- **Turn features on/off, or remove an asset** → the `CONFIG.crates*` toggles
  (**§12 Reverting**) and the per-asset cookbook (**§13 Editing assets**).

---

## 11. Golden Crates (v2) — free in-level finds

**Shipped.** One rare glowing **golden crate** (🎁) can appear per **campaign**
level as a standalone **non-solid drive-over pickup**. Driving over it gives a
**free pull** through the same grant pipeline (§2–§7), with a **non-blocking**
reveal so the race never stops.

**Why non-solid, not a smashable block:** placement is procedural, so a *solid*
crate could wedge a kid who arrives slowly in a tight corridor next to a crusher.
A non-solid pickup can never trap them — and it still bursts with debris + gold
sparkles, so it reads as a satisfying smash.

**It is a separate entity — `game.gold`, never in `game.crates`** — so the ~300
wooden `x` crates, `isSolid`, `crateAt`, the `collideWalls` smash branch,
`drawCrate`, and the boss rival are all left untouched.

- **Spawn** (`spawnGolden`, called from `startLevel` after the flow field exists):
  campaign-only (`levelIx>=0`, not VS/KO/co-op/builder/custom, and master
  `cratesEnabled`). A **deterministic per-level** decision (`goldenHash(levelIx) <
  CONFIG.goldenCrateChance`) picks which levels carry a golden crate — the same
  ~30% of levels every time, so it can't be farmed by re-racing — and it's skipped
  once the crate has been **collected on that level** (`store.goldTaken[levelIx]`).
  Placed on the `bfsPathCells(start→finish)` racing line — avoiding start/finish,
  key, doors, coins, other crates, portals, conveyors, trap-doors, **whole crusher
  lanes**, and goober patrols. No safe cell → no crate (a safe no-op).
- **Grab** (`updateEntities`, human `game.car` only, within `CELL*0.5`) →
  `grabGolden`: rolls `CRATES.golden.odds` `[0,50,32,14,4]` (never common; its
  legendary/secret sit just under the Mega Box), grants + `save()`s **before** any
  FX (banked even if the kid crashes the next frame), then celebrates
  non-blocking — debris, sparkles, floats, screen confetti, sound, and an
  auto-expiring banner (`drawGoldReveal`, ~2.8s, captures no taps, pauses nothing),
  and sets `store.goldTaken[levelIx]` so **this level's crate never comes back**.
- **The boss rival can't touch it:** the rival smashes only `game.crates`, and the
  grab checks `game.car` only.
- **Draw:** `drawGold` (world-space pulsing glow + bobbing gold box + 🎁 face).
- **One-per-map:** each level's golden crate is a **one-time** find — once grabbed
  it's gone there forever (`store.goldTaken`), so re-racing a level can't farm more.
  **Off switch:** `CONFIG.goldenCrateChance = 0`, or the master `cratesEnabled`.

---

## 12. Reverting & turning it off

Three ways to make crates go away, least-destructive first: **(A)** flip CONFIG
flags — code stays, save stays, instantly reversible; **(B)** `git revert` — code
goes, save stays; **(C)** delete data lines — surgical removal of one asset (§13).
None of these ever touches `localStorage`; the *code version* alone decides which
save fields get read, so no revert method requires wiping the save.

### 12.1 The off-switches (CONFIG flags — no code deletion)

Flags live in the **🔧 TWEAK ZONE** `CONFIG` object (beside `powerUpsInVs`): a
**master + one per gameplay bucket**, plus the golden-crate dial. **Currency has
no flag on purpose** — it's the safety floor that keeps every pull non-empty.

A per-bucket flag does **two** things, so the result is indistinguishable from the
pre-crates game: it **excludes that bucket from the drop pool** *and* **no-ops its
runtime effect** (an old save that already owns items behaves as if it doesn't).

Three one-line helpers fold the master into each bucket (they live near `upgMul`):

```js
function upgOn(){ return CONFIG.cratesEnabled && CONFIG.cratesUpgrades; }
function puOn(){  return CONFIG.cratesEnabled && CONFIG.cratesPowerups; }
function cosOn(){ return CONFIG.cratesEnabled && CONFIG.cratesCosmetics; }
```

So **`cratesEnabled = false` equals all three buckets off, the hub button hidden,
and golden crates stopped.**

| Flag | Default | OFF behaviour | Checked in (by function name) |
|---|---|---|---|
| **`cratesEnabled`** (master) | `true` | 🎁 CRATES button hidden; screen unreachable; every gameplay effect dead; golden crates stop spawning. | `drawSeries()` `gbtns` (conditional spread) + the `b.act==="crates"` handler (guarded); a normalizer at the top of `tick()`; `spawnGolden()` bails. All gameplay reaches through the three helpers below. |
| **`cratesUpgrades`** | `true` | engine/grip/nitro/magnet/lucky never drop *and* never apply. | **`boosted()`** returns `false` when `!upgOn()` (the single gate for `mSpd/mGrip/mNit`, `magR`, lucky). Also `upgMul()`→`1`; `poolForTier()` skips `{type:"upg"}`; `drawCrates()` hides the UPGRADES row. |
| **`cratesPowerups`** | `true` | No power-up drops, and no armed power-up ever fires. | **`armRun()`**'s `allow` (the single arming choke — `blockHit`, the freeze/slow-mo triggers, `firePU`, the `tick` slow-mo, the `drawHUD` badge all go dark for free). Also `poolForTier()` skips `{type:"pu"}`; `drawCrates()` hides the POWER-UPS row. |
| **`cratesCosmetics`** | `true` | No cosmetic drops, and the equipped look stops rendering. | **`cosTrail()`** and the `drawCar()` cosmetic block skip when `!cosOn()`. Also `poolForTier()` skips `{type:"cos"}`; `drawCrates()` hides the LOOKS row. |
| **`goldenCrateChance`** | `0.3` | `0` = no golden crates spawn (v2 off, independent of the buckets). | `spawnGolden()`. |

Notes:
- **`poolForTier()` never returns empty.** With buckets excluded a tier can empty,
  so a coin floor (`if(!pool.length) pool.push({type:"cur", coins:20*(t+1)})`)
  backs the toggles — every pull still lands on a real reward.
- **`CONFIG.powerUpsInVs` is a different axis** (VS/KO/co-op *fairness*, not on/off).
  `cratesPowerups=false` correctly wins over it.
- **Non-destructive.** The kid's collection sits untouched in `localStorage`;
  flipping any flag back to `true` restores everything exactly.

### 12.2 Full revert via git

The system shipped across two self-contained commits touching only `index.html`,
`docs/MYSTERY-CRATES.md`, and `README.md`:
- **`2b84df4`** — Mystery Crates **v1** (garage economy).
- the **v2** golden-crates commit (this one).

Find both with `git log --oneline -i --grep=crate`. Then:
- **Recommended — keep history:** `git revert <hash>` on either or both commits
  (newest first) — inverse commits that remove the code, doc, and README notes.
  Reversible again later.
- **Code-only restore:** `git checkout 8416f2c -- index.html` then commit — pulls
  `index.html` back to the pre-crates state (`8416f2c`, "World 4").
- **Nuclear (rewrites history):** `git reset --hard 8416f2c` — only safe if the
  crate commits haven't been pushed/shared.

Preview first: `git show <hash> --stat` and `git diff 8416f2c HEAD -- index.html`.

### 12.3 What happens to `localStorage` across a revert

The save lives under key **`turboMaze`** and loads via
`Object.assign(store, JSON.parse(s))` (a shallow merge onto the `store` literal).

- **Crates code → pre-crates code:** the save still holds `upg`, `powerups`,
  `armed`, `cosmetics`, `cosmetic`, `cratesOpened`, `goldenFound`, `goldTaken` — copied onto
  `store` but **nothing reads them** → inert. No crash, no wipe.
- **Pre-crates save → crates code (or flag back ON):** missing keys take their
  `store`-literal defaults. Also safe.
- **Stale-id caveat:** if `store.cosmetic` / `store.armed` names an item whose data
  line is gone, the render/arm sites guard it *and* the load-time reconcile (§13.7)
  nulls the dead pointer → it just falls back to default look / no badge.
- **Not refunded:** spent coins stay spent; owned upgrades go inert (not
  re-credited). The save is preserved, so a later re-enable restores the collection.

**Bottom line: no revert path requires clearing the save.**

---

## 13. Editing assets — cookbook (ADD · CHANGE · REMOVE)

§9 lists the data tables; §10 is the one-liner knobs. This is the procedural
layer: for every asset type, the exact table field to edit and the exact function
that must move with it.

**General removal rule.** With the hardening guards in place (§13.7), **deleting
any single data line is crash-proof** — even against an old save that still names
the removed id. The *only* extra edits a delete needs are **behavioural code
couplings** — a power-up's bespoke trigger, or an upgrade's physics line — flagged
inline and summarised in §13.7.

### 13.1 A crate — `CRATES`

Fields: `name`, `emoji`, `price`, `odds:[common,rare,epic,legendary,secret]`
(relative weights; `rollTier()` normalises, so they needn't sum to 100).

- **CHANGE price / odds:** edit the numbers. The last `odds` entry is the SECRET
  chance (`1` ≈ 1-in-100 on the Mystery Crate).
- **ADD a crate:** add a keyed entry. The **buyable shop is data-driven**
  (`drawCrates()` lays out `Object.keys(CRATES)` filtered to **`price>0`**, and
  `cratesAction()` routes any `buy:<key>`), so a priced crate's card + buy button
  appear automatically. A **`price:0` crate is a free/in-level find, not sold** —
  it won't show a shop card (that's exactly how the v2 `golden` crate works; grant
  it yourself like `grabGolden` does). *Adding a 3rd+ buyable crate:* the grid
  wraps 2-across automatically, but eyeball `drawCrates()`'s vertical spacing.
- **REMOVE a crate:** delete its `CRATES` line — **that's the whole edit.** Card +
  buy button vanish; `crateCard()`/`drawReveal()` fall back safely mid-reveal.

### 13.2 An upgrade stat — `CRATE_UPG`

Fields: `name`, `emoji`, `mult:[1, t1..t5]`. **Index 0 = none; 1..5 =
common..secret.** Array length must be `RARITY.length + 1` (`grantDrop` uses
`newTier = t+1`). `UPG_KEYS = Object.keys(CRATE_UPG)` updates automatically at load.

- **CHANGE the mult curve:** edit `mult` (keep index 0 = `1`). Design rule (§4):
  difficulty stats (engine, grip) bump small; feel-good stats (nitro, magnet,
  lucky) bump big. `upgChip()` + reveal recompute — no other edits.
- **ADD a stat:** (1) add a keyed entry with a full-length `mult`; (2) *optionally*
  add a matching `0` to the `store` literal `upg:{…}` (tidy, not required —
  `upgMul` defaults `||0`); (3) **wire its effect** — every stat has a bespoke
  physics hook (no generic applier): speed-style → read `upgMul("<key>")` in
  `updateCar()` beside `mSpd/mGrip/mNit`; world-effect style (magnet/lucky) → in
  `updateEntities()`. A stat with no hook is collectible but inert.
- **REMOVE a stat:** delete its `CRATE_UPG` line — **crash-safe alone.** `upgMul()`
  guards a missing key and returns `1` (and `grantDrop` guards it too), so the
  paired physics call degrades to ×1. *Optional tidy:* delete that stat's physics
  term. An old save's leftover `store.upg` key is ignored.

### 13.3 A power-up — `POWERUPS`

Fields: `name`, `emoji`, `rarity` (0..4, the tier it drops in), `desc`. Stock is
`store.powerups[id]`; the armed one is `store.armed`. Power-ups split into
**start-fire** (fire + consume at run start) and **reactive** (stashed on
`car.pu`, consumed only when they trigger).

- **CHANGE:** edit `rarity` to move its tier; `desc`/`emoji`/`name` for looks.
- **ADD:** (1) add a keyed entry; (2) wire its trigger in **`armRun()`**:
  *start-fire* → an `else if(id==="<id>"){ …; consumeArmed(); puFloat("…"); }`
  branch; *reactive* → the final `else` already sets `c.pu=id`, then handle where
  it goes off — "eat the next hit" → a branch in **`blockHit()`**; proactive → a
  branch in the `game.car.pu` block of `updateEntities()`, calling
  **`firePU(kind,x,y)`**. (3) *Optional* HUD badge in `drawHUD()`.
- **REMOVE:** delete the `POWERUPS` line **and** its bespoke trigger branch(es).
  Crash-safety against an old save that stocks/arms it is automatic (the
  `drawCrates` owned filter + `puChip` guard skip it, `armRun`'s `!POWERUPS[id]`
  refuses it, the reconcile nulls a dangling `store.armed`).

### 13.4 A cosmetic — `COSMETICS`

Fields: `name`, `emoji`, `rarity`, `kind` (`trail` | `shine` | `topper`), and
`col` (trail only; `"rainbow"` = hue-cycling, else a hex). Owned ids in
`store.cosmetics[]`; worn one in `store.cosmetic`. Owned cosmetics are excluded
from the pool (no dupes).

- **CHANGE colour/emoji:** edit `col` (trail) or `emoji` (topper). Free re-render.
- **ADD:** add a keyed entry. An existing `kind` renders with **zero code** —
  `trail` via `cosTrail()`, `shine`/`topper` via the block at the end of
  `drawCar()`. A **new `kind`** needs its own branch there.
- **REMOVE:** delete the `COSMETICS` line — **pure data delete.** Render sites
  guard (`cosTrail()`/`drawCar()` do `if(c && …)`), `cosChip()` is guarded, the
  LOOKS list is filtered to live ids, and the reconcile nulls a removed
  `store.cosmetic`.

### 13.5 A currency filler — `CURRENCY`

Fields: `name`, `emoji`, `rarity`, and **either** `coins` **or** `aura`. Paid out
instantly by `grantDrop()`; nothing persisted references it.

- **CHANGE / ADD:** edit or add a keyed entry — `grantDrop`'s currency branch
  handles "has `coins`" vs "has `aura`" generically.
- **REMOVE:** delete the line — **fully safe** (the coin floor keeps pools
  non-empty). Currency is the template every other bucket's hardening imitates.

### 13.6 Rarity tiers — `RARITY` (advanced, index-coupled)

`RARITY[0..4]` = `{key, name, col}`. The index is the tier used everywhere.

- **CHANGE a colour/name:** edit `col`/`name`; reveal, chips, odds recolour free.
- **CHANGE odds:** edit a crate's `odds` array (§13.1) — the real frequency dial.
- **ADD a tier:** touch every index-coupled spot — append to `RARITY`; extend
  **every** `CRATES.odds` by one weight; extend **every** `CRATE_UPG.mult` by one
  value; optionally give some asset the new `rarity`. `rollTier`/`grantDrop`/
  `drawReveal` are length-generic.

### 13.7 Removal-safety matrix (what a bare data-delete really touches)

| Delete a line from… | Crash-proof data delete? | Also required (behaviour only) |
|---|---|---|
| `CURRENCY` | ✅ Yes | nothing |
| `CRATES` (a crate) | ✅ Yes (data-driven loop) | nothing |
| `COSMETICS` | ✅ Yes | nothing (a *new `kind`* you added needs its render branch removed) |
| `CRATE_UPG` (a stat) | ✅ Yes (`upgMul`/`grantDrop` → ×1/coins) | *optional:* delete the paired physics term |
| `POWERUPS` | ✅ Yes | remove its bespoke `armRun`/`blockHit`/`updateEntities` trigger branch (if any) |
| `RARITY` (a tier) | ⚠️ Advanced | shorten every `CRATES.odds` + every `CRATE_UPG.mult`; re-home any asset whose `rarity` pointed at it |

**The hardening choke points that make this true** (implemented once):
1. `upgMul()` + `grantDrop()` guard a missing `CRATE_UPG` key → physics ×1 / coin payout.
2. `armRun()`'s `!POWERUPS[id]` check → a deleted armed id never enters a run.
3. `drawCrates()` filters `owned`/`looks` to live ids + `puChip`/`cosChip` guards.
4. `drawCrates()` loops `Object.keys(CRATES)` + `cratesAction()` `buy:` prefix + `crateCard`/`drawReveal` guards.
5. `poolForTier()` coin-floor + `grantDrop()` `CURRENCY[drop.id]||drop`.
6. Load-time reconcile nulls a dead `store.armed`/`store.cosmetic`.
