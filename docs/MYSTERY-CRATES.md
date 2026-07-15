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
cratesOpened: 0,     // lifetime counter (flavour / future stats)
```

Per-run fields set on `game.car` (not persisted): `dbl`, `shield`, `pu`,
`ghostT`, `luckyAcc`. Per-run global: `game.slowmo`, `game.gt`, and `frozen` on
each goober.

**`boosted(car)`** is the single gate deciding whether upgrades/power-ups apply:
`true` only for `game.car` in a campaign run, unless `CONFIG.powerUpsInVs` is on.

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
| Physics hooks | `updateCar` (mSpd/mGrip/mNit), `updateEntities` (magR/lucky/double, freeze & slow-mo triggers, blockHit), `tick` (slow-mo `gdt` + `game.gt`) |
| Nav wiring | hub `gbtns` (`🎁 CRATES` button) + its handler; the `state==="crates"` line in `tick()`; `armRun()` call in `startLevel` |
| Config | `CONFIG.powerUpsInVs` (in the 🔧 TWEAK ZONE) |

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

---

## 11. v2 — in-level crates (not built yet)

The plan the grant code is ready for:
- Spawn a rare **glowing golden crate** on some campaign tracks (a new variant of
  the existing breakable crate `x`, so all ~300 current crates keep behaving
  exactly as today).
- On smash (the fast-hit branch in `collideWalls`), call `openCrate`-style grant
  logic for a **free** pull mid-race.
- Everything in §2–§7 is reused as-is; only a spawn rule + a smash hook are new.
