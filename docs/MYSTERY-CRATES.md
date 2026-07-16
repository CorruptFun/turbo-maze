# 🎁 Mystery Crates — system reference (v3)

The garage's **crate / upgrade / power-up** economy. This is the "collect &
unlock, numbers-go-up" layer inspired by the collect-a-roster games (Steal a
Brainrot / Grow a Garden) — but built from **original mechanics**, no meme IP.

Everything here lives inside the single `index.html`. This doc is the map: it
explains what the system does, the exact loot tables, the save-data model, and
**where every piece hooks into the code** so anyone (human or agent) can extend
it without spelunking. Code is referenced by **function name** (line numbers
drift); search `index.html` for the banner `🎁 MYSTERY CRATES (v1)`.

> **Scope.** v1 = crates you buy in the garage. **v2 (shipped)** = the rare 🎁
> golden crates that spawn inside levels (§11). **v3 (shipped)** = the expanded
> catalog (new upgrades, GOLD prestige tier, new power-ups, new cosmetic slots,
> treasure chest) + the 📖 collection book with NEW! badges (§14).

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

> **🥇 PRESTIGE (v3).** GOLD is a **6th upgrade-only tier** — deliberately **not**
> a `RARITY` entry, so no `odds` array or index-coupled code (§13.6) ever has to
> know about it. It lives as `const PRESTIGE = { name:"GOLD", col:"#ffe14d" }`
> (canonical gold colour for chips, the reveal, and the collection book). You
> can't roll GOLD directly: a **LEGENDARY+ upgrade roll on an already-SECRET
> stat promotes it** to GOLD (see §4). Gold dupes fall through to the coin refund.

---

## 4. Loot bucket A — Upgrades (permanent)

`CRATE_UPG`. You **keep the best of each stat** — a higher-tier pull replaces the
lower one, no loadout screen. `mult` is indexed by tier: **index 0 = none**,
`1..5 = common..secret`, **6 = 🥇 GOLD prestige (v3)**. Design rule: stats that
touch difficulty (engine, grip) bump **small**; feel-good / forgiveness stats
(nitro, magnet, and the v3 four) bump **big**.

| Stat | Emoji | tier1 | tier2 | tier3 | tier4 | tier5 | 🥇 GOLD | What it multiplies |
|---|---|---|---|---|---|---|---|---|
| `engine` | 🔧 | +2% | +4% | +6% | +9% | +12% | +14% | top speed (`maxSp` + `accel`) |
| `grip` | 🛞 | +3% | +6% | +10% | +15% | +22% | +26% | lateral grip (drift regain + ice) |
| `nitro` | ⚡ | +10% | +20% | +35% | +55% | +80% | +100% | nitro drain↓ & regen↑ |
| `magnet` | 🧲 | +12% | +25% | +40% | +60% | +90% | +110% | coin pull radius (base 95px) |
| `lucky` | 💰 | +3% | +6% | +10% | +16% | +25% | +30% | bonus coins banked |
| `pads` 🆕v3 | 🔋 | +10% | +20% | +35% | +55% | +80% | +100% | boost/splash pads: kick (damped 40%) + nitro refill (full strength) |
| `clock` 🆕v3 | ⏰ | +4% | +7% | +10% | +14% | +18% | +22% | par seconds for the ⏱ star (never harder) |
| `boom` 🆕v3 | 🧨 | +25% | +50% | +75% | +100% | +150% | +200% | bonus coins from smashed crates (`(mult−1)` expected per smash) |
| `bumper` 🆕v3 | 🦺 | +25% | +45% | +75% | +120% | +190% | +250% | goober steal shrinks: `floor(3/mult)` = 2,2,1,1,1 · GOLD **0** |

**Where they apply** (all gated by `boosted(car)` — see §8):
- `engine` / `grip` / `nitro` → computed once at the top of `updateCar()` as
  `mSpd` / `mGrip` / `mNit`, then folded into `maxSp`, `accel`, the `grip`
  term, and the two `car.nitroMeter` lines.
- `magnet` → `magR` in the coin loop of `updateEntities()` widens the attract range.
- `lucky` → a fractional accumulator (`car.luckyAcc`) in the same coin loop that
  banks a bonus coin once it crosses 1.0. Only the **bank** is inflated;
  `car.coins` (the run's star/steal counter) stays honest.
- `pads` (v3) → the boost-pad block of `updateEntities()` (`mPad`: kick damped
  40%, nitro refill full-strength, sparkles at ≥ tier 2) **and** the splash-pad
  (`game.bounces`) refill line.
- `clock` (v3) → the **`parFor(L)`** helper (`L.par × upgMul("clock")`, campaign
  human only via `boosted(game.car)`). Called from `levelClear()`'s `timeOk` and
  `drawHUD()`'s `late` — **`coopClear`/`drawCoopHUD` par math untouched**.
- `boom` (v3) → the crate-smash branch of `collideWalls()`: `(mult−1)` expected
  bonus coins via `scatterCoins` (fractional part rolls a die; GOLD = 2 guaranteed).
- `bumper` (v3) → the goober-yoink branch of `updateEntities()`: shrinks `steal`
  only (bonk/spin/knockback slapstick untouched; GOLD shows "🦺 NO COINS TAKEN!").

Duplicate protection: if an upgrade rolls a stat you already own at that tier or
better, `grantDrop()` pays out coins instead (`20 × tier`).

**🥇 Prestige rule (v3):** a **LEGENDARY or SECRET** upgrade roll (`t>=3`) that
lands on a stat already at **SECRET (tier 5)** promotes it to **GOLD (tier 6)**
instead of refunding coins. Result carries `gold:true` (and **no** `badge` — the
gold confetti/beep is its garnish). Further rolls on a gold stat fall through to
the normal dupe-coins path. Guard: prestige only fires while
`mult.length > RARITY.length+1`, so trimming a `mult` array back to 6 entries
switches the whole feature off safely (§13.7).

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
| `party` 🆕v3 | 🎊 | common | scatters 6 bonus coins around the start | run start (consumed at GO) |
| `megamag` 🆕v3 | 🧲 | rare | 4s super coin pull (flat 340px radius, pull 10) | 3+ coins within 150px |
| `saver` 🆕v3 | 🛟 | epic | auto-hop clean over one fall / goober | on a trap-door / foam / goober hit |
| `warp` 🆕v3 | 🌟 | epic | zips up to 3 cells along the racing line | run start (**not consumed** if no safe hop) |

### Lifecycle (see the "power-up run lifecycle" helpers)
- **`armRun()`** — called once at the end of `startLevel()`. Clears last run's
  flags, then, if power-ups are allowed and one is armed:
  - `rocket` / `double` / `party` / `warp` fire immediately and are **consumed
    now** (they always help) — with one kindness exception: **`warp` is NOT
    consumed if it finds no safe hop** (door/gate/trap/crumble/crusher-lane in
    the first cell), so it carries to the next race.
  - `shield` / `freeze` / `ghost` / `slowmo` / `saver` / `megamag` are stashed on
    `car.pu` and fire **reactively**. They're only consumed **when they actually
    trigger** — so an unused one carries over to your next race. (Kind to a
    7-year-old.)
- **`consumeArmed()`** — decrements `store.powerups[id]`; when it hits 0 the id
  is removed and `store.armed` is cleared (otherwise it stays armed, so a stack
  of 3 shields auto-re-arms each race).
- **`blockHit(car, x, y)`** — the shared "eat the next hit" gate. Called from the
  trap-door check, the foam-`"gone"` check, and the goober-yoink branch in
  `updateEntities()`. Returns `true` (and fires shield/ghost/saver) when a hit
  is absorbed.
- **`firePU(kind, x, y)`** — consume + float text + sound + puff for a reactive fire.
- Freeze, slow-mo & mega-magnet **proactive triggers** live in `updateEntities()`
  right after the crusher update (they need to see goober/crusher/coin positions).

### v3 reactive internals
- **`saver` 🛟 reuses the proven splash-pad `airT` contract** — it launches the
  car along its heading (`car.airT = car.airMax = 0.55`, same clamp curve as a
  splash pad, plus 1.2s invuln), so it needed **zero call-site edits**: airborne
  cars already sail over hazards (`car.airT>0` early-outs) and the existing
  splashdown + `collideWalls` push-out handle landing.
- **`megamag` 🧲 uses a per-run `car.magT` timer** (set to 4s on trigger, decays
  in `updateCar`, reset in `armRun` — **never persisted**). While `magT>0` the
  coin loop uses a **flat 340px radius** (no creep with the magnet upgrade) and
  a stronger pull (10 vs 6), player car only.

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
| `trail_bubble` 🆕v3 | 🫧 | rare | `trail` | light-blue motion trail (zero-code — `cosTrail()`) |
| `glow_lava` 🆕v3 | 🌋 | rare | `glow` | orange pulsing underglow (underglow branch in `drawCar()`) |
| `glow_galaxy` 🆕v3 | 🌌 | epic | `glow` | hue-cycling pulsing underglow (same branch, `col:"rainbow"`) |
| `confetti_party` 🆕v3 | 🎆 | epic | `confetti` | rainbow multi-burst on level clear (branch in `levelClear()`) |
| `topper_dino` 🆕v3 | 🦖 | legendary | `topper` | emoji bobbing above the car (zero-code) |
| `topper_unicorn` 🆕v3 | 🦄 | secret | `topper` | emoji bobbing above the car (zero-code — restocks the SECRET pool) |

Kinds are now **`trail` | `shine` | `topper` | `glow` | `confetti`** (v3 added the
last two). `glow` recolours the underglow ellipse in `drawCar()` — brighter,
pulsing, 1.25× radius, player car only; `confetti` swaps `levelClear()`'s
level-hue burst for a 4-colour rainbow multi-burst. Both branches are
kind-guarded, so deleting the data line leaves them inert (§13.7).

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
| `chest` 🆕v3 | 🧰 | epic | +250 coins — epic filler so a late-game epic pull (all epics owned) never feels empty |

---

## 8. Save-data model (`store`)

New fields on the `store` literal (all **default-safe**: the loader does
`Object.assign(store, JSON.parse(saved))`, so an old save simply keeps these
defaults and nothing breaks or renames):

```js
upg:      { engine:0, grip:0, nitro:0, magnet:0, lucky:0,
            pads:0, clock:0, boom:0, bumper:0 },  // best tier per stat — 9 stats (v3), tiers 0–6 (6 = 🥇 GOLD)
powerups: {},        // { id: count } — one-use stock
armed:    null,      // id of the armed power-up, or null
cosmetics:[],        // owned cosmetic ids
cosmetic: null,      // equipped cosmetic id, or null
cratesOpened: 0,     // lifetime: crates bought in the garage
goldenFound: 0,      // lifetime: free golden crates smashed in levels (v2)
goldTaken:   {},     // { levelIx: 1 } — levels whose one-time golden crate is already collected
found:     {},       // 📖 v3 lifetime discovery ledger — { "pu:rocket":1, "upg:engine":1, ... }
seenItems: {},       // 📖 v3 viewed ledger — found minus seenItems = the NEW! badges
```

**Ledger keys are namespaced**: `upg:<stat>` / `pu:<id>` / `cos:<id>` /
`cur:<id>`. Plain objects (`key → 1`), never `Set`/`Map` — they must survive the
`JSON.stringify` round-trip. `found` **cannot be derived** from the rest of the
save: power-up stock is deleted at 0 (`consumeArmed`) and currency persists
nothing. A **load-time backfill** (right after the reconcile block) seeds
already-owned items as found **and** seen, so an existing save gets no
silhouette/NEW!-spam on upgrade day. Old saves' shallow-assigned `upg` lacks the
four v3 keys — `upgMul`'s `||0` plus its tier clamp cover it, **no migration**.

Per-run fields set on `game.car` (not persisted): `dbl`, `shield`, `pu`,
`ghostT`, `luckyAcc`, `magT` (🧲 mega-magnet burst timer, v3). Per-run globals:
`game.slowmo`, `game.gt`, `game.gold` (the golden crate this run, or null) and
`game.goldReveal` (its banner, or null).

**Which gate controls what** (the audit corrected a common assumption):
- **Upgrades** funnel through **`boosted(car)`** — `true` only for `game.car` in a
  campaign run (unless `CONFIG.powerUpsInVs`), and `false` when `upgOn()` is off.
- **Power-ups** are gated only at **`armRun()`** (they never touch `boosted`).
- **Cosmetics** gate at `cosTrail()` / the `drawCar` block via `cosOn()`.

---

## 9. Code map (search these names in `index.html`)

| Area | Names |
|---|---|
| Data tables | `RARITY`, `PRESTIGE` (v3), `CRATES`, `CRATE_UPG`, `POWERUPS`, `COSMETICS`, `CURRENCY` |
| Roll / grant | `rollTier`, `poolForTier`, `grantDrop`, `openCrate` |
| Helpers | `upgMul`, `boosted`, `parFor` (v3 ⏰) |
| Power-up lifecycle | `armRun`, `consumeArmed`, `blockHit`, `firePU`, `puFloat` |
| Cosmetic render | `cosTrail` + the cosmetic block at the end of `drawCar` + the underglow branch (v3 `glow`) + the `levelClear` burst branch (v3 `confetti`) |
| Screen | `drawCrates`, `crateCard` (v3: chance bar), `upgChip`, `puChip`, `cosChip`, `drawReveal`, `cratesAction`, `sectionLabel`; **v3 book**: `bk`, `silhouette`, `bookSections`, `drawBook`, `bookPanel`, `bookTile`; **v3 ledger**: `liveKey`, `isNewItem`, `unseenCount`, `bookSeen` |
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
- **🥇 Prestige pacing (v3)** → drop rate is a consequence of the Mega Box's
  legendary+secret odds (`15+5 = 20%` × the ⅙-ish upgrade share of the pool ×
  1/9 stats): **~1 gold per ~8 Mega Boxes (~1,600 coins) per remaining stat** —
  9 golds is a deliberate multi-week chase. Tune via `CRATES.mega.odds`, not new
  code.
- **Coin-faucet ceilings (v3)** — keep every faucet below crate prices so no
  infinite loop opens up: `boom` GOLD ≈ +2 coins/crate smashed, `chest` EV ≈
  +12/Mega Box, `lucky` GOLD ≈ +5/run — all far under the 100-coin Mystery price.
- **Mega-magnet burst (v3)** → the flat `340`px radius / `4`s timer / pull `10`
  in `updateEntities` + the trigger (3 coins within 150px).
- **Warp cap (v3)** → the 3-cell hop limit (`i<=3`) in `armRun()`'s warp branch;
  its `bad()` lambda is the never-lands-in-danger contract — extend it if new
  hazard types ship.
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

Fields: `name`, `emoji`, `mult:[1, t1..t5, gold]`. **Index 0 = none; 1..5 =
common..secret; 6 = 🥇 GOLD prestige (v3).** Invariant: **`mult` length =
`RARITY.length + 2` (last = GOLD)** — `grantDrop` uses `newTier = t+1` and the
prestige branch reads `mult[RARITY.length+1]`. Trimming an array back to
`RARITY.length + 1` entries switches prestige off for that stat (saved tier-6
clamps to tier-5 values — degrades, never crashes). `UPG_KEYS =
Object.keys(CRATE_UPG)` updates automatically at load.

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

Fields: `name`, `emoji`, `rarity`, `kind` (`trail` | `shine` | `topper` |
`glow` | `confetti` — the last two are v3), and
`col` (trail/glow; `"rainbow"` = hue-cycling, else a hex). Owned ids in
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

**v3 removal cheat-sheet** (what actually catches each delete):

| Remove… | Caught by |
|---|---|
| `pads`/`clock`/`boom`/`bumper` (a v3 stat) | `upgMul()`→1 at each physics hook; `UPG_KEYS`-driven rows/book shrink automatically |
| `party`/`warp`/`saver`/`megamag` (a v3 power-up) | `armRun()`'s `!POWERUPS[id]` chokepoint; their trigger branches go inert (never reached without `c.pu`) |
| a `glow`/`confetti` cosmetic | the kind-guarded branches in `drawCar`/`levelClear` go inert; reconcile nulls a worn id |
| `trail_bubble` / the v3 toppers / `chest` | existing reconcile + generic render/grant branches (nothing bespoke) |
| the **whole PRESTIGE feature** | trim every `mult` array to `RARITY.length+1` entries — the `mult.length` guard in `grantDrop` stops new golds; saved tier 6 clamps to tier-5 values everywhere (`upgMul`/`upgChip`/book) |
| the book/badges | live-table enumeration (`bookSections` builds from the data tables, never the save), `liveKey` ignores stale ledger keys, `bookSeen` self-clears them, floor-coin drops (no id) never mark the ledger |

**REMOVE an item → the book shrinks automatically; stale ledger keys are inert
and self-clearing** (a `store.found` key whose asset is gone is skipped by
`unseenCount` via `liveKey` and swept to seen by the next `bookSeen`).

**The hardening choke points that make this true** (implemented once):
1. `upgMul()` + `grantDrop()` guard a missing `CRATE_UPG` key → physics ×1 / coin payout.
2. `armRun()`'s `!POWERUPS[id]` check → a deleted armed id never enters a run.
3. `drawCrates()` filters `owned`/`looks` to live ids + `puChip`/`cosChip` guards.
4. `drawCrates()` loops `Object.keys(CRATES)` + `cratesAction()` `buy:` prefix + `crateCard`/`drawReveal` guards.
5. `poolForTier()` coin-floor + `grantDrop()` `CURRENCY[drop.id]||drop`.
6. Load-time reconcile nulls a dead `store.armed`/`store.cosmetic`.
7. (v3) `liveKey()` + `bookSeen()`'s full-`found` sweep make deleted assets' ledger keys badge-proof.

---

## 14. Collection Book, NEW! badges & reveal v3

The 📖 **collection book** is a Pokédex-style overlay on the crates screen: every
item in the live data tables gets a tile — found items show their emoji (+ tier
pips for upgrades), unfound ones show a dark **silhouette** and a rarity-coloured
"?" (top-tier items stay a pure "?" — secrets stay secret). It's the home of the
**NEW!** badge loop that turns every fresh pull into a reason to come back.

### 14.1 Ledger fields & helpers

- **`store.found`** — lifetime discovery ledger (`{"pu:rocket":1, ...}`,
  namespaced keys per §8). Written **only** by `grantDrop()`; both `openCrate`
  and `grabGolden` call `save()` right after, so it persists for free.
- **`store.seenItems`** — viewed ledger. `found − seenItems` = the NEW! set.
- **`liveKey(k)`** — true iff the key's asset still exists in the data tables;
  guards stale keys of deleted assets (no phantom badges, §13.7).
- **`isNewItem(k)`** — found and not yet seen.
- **`unseenCount()`** — live unseen total (drives the pink header bubble).
- **`bookSeen()`** — sweeps **all** of `found` into `seenItems` (idempotent,
  save-guarded); called on any book close. Sweeping everything (stale keys
  included) makes a deleted asset's badge state self-clear after one visit.
- **Backfill** (load-time, after the reconcile block): seeds already-owned items
  as found **and** seen — an existing save sees no NEW!-spam on upgrade day.

### 14.2 `grantDrop` result tags

Every result may now carry:
- **`badge: "new"`** — first-ever find (power-up / cosmetic / currency-with-id /
  upgrade stat). Drives the reveal's NEW ITEM! pill + first-find chime, the gold
  NEW tag on the golden-crate banner, and the chip dots.
- **`badge: "dupe"`** — a maxed upgrade roll refunded as coins (grey
  "DUPLICATE → COINS!" pill).
- **`gold: true`** — a 🥇 prestige promotion. Deliberately carries **no
  `badge`** — its garnish is the gold-coloured reveal, extra gold confetti burst
  and prestige beep ("NEW ITEM!" copy would be wrong for a promotion).
- Floor coins (the empty-pool fallback, no `id`) never mark the ledger or badge.

### 14.3 Badge surfaces & clear rules

Show: pink pulse-bubble on the 📖 header button (`unseenCount`, "9+" cap) ·
gold NEW! corner tags bobbing on book tiles · gold dots on `upgChip`/`puChip`/
`cosChip` · NEW ITEM! pill in `drawReveal` · NEW! tag in `drawGoldReveal`.
Clear: **closing the book** (✕, backdrop tap, or back-while-open) runs
`bookSeen()` and clears everything; **arming** a power-up or **wearing** a
cosmetic clears that one item immediately (`store.seenItems[...]=1` in
`cratesAction`).

### 14.4 Book layout & autosize

Module state `const bk = { open:false, t:0 }` (module-local like `sh`, never
persisted; hub entry resets `bk.open`). While open, `drawBook` **owns the tap
surface** — `drawCrates` wipes `hudBtns` first, so buy/arm/wear/back are
unreachable and a reveal can never spawn under the book. Panel = full-safe-area
rounded sheet; header = title / `X / Y FOUND` (🏆 when complete) / ✕; rarity
legend row beneath. Bucket panels honor the toggles (`upgOn`/`puOn`/`cosOn`,
TREASURE always shows): **4-across** when `bw>=880` (iPad 1180×820), **2×2**
otherwise (phone 956×440). Tiles autosize 54→36px until any v3 item count fits
with **no scroll** (post-v3 counts 9/10/11/4). Tapping a found tile toasts its
info line via `sticker()`; an unfound tile toasts a hint.

The main loot view got the same two-viewport pass (v3): a `SHORT = H<520`
compact mode (92px crate cards, shorter chips), the chip rows widened into a
**640px band** (`rowW`) so 9 upgrade chips + 10 power-ups fit one row each, and
`crateCard` gained a per-rarity **chance bar** (live `odds`-driven, 6px visible
floor for tiny slices, twinkling SECRET sliver) — the rarity legend in the book
doubles as its decoder ring.

### 14.5 Silhouette cache

`silhouette(emoji, px)` draws the emoji on a small offscreen canvas and tints it
dark via `globalCompositeOperation = "source-in"`, cached per `(emoji,size)` in
a `Map`. **No `ctx.filter`** — it's the one canvas API this game avoids because
iOS Safari support is unreliable; source-in compositing works everywhere the
game runs. Cache stays warm after the first frame, so the book renders at 60fps.
