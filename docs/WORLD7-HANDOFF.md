# 🌋 WORLD 7 — HOT LAVA: build state + handoff (2026-07-17)

> ✅ **SHIPPED (2026-07-17)** — World 7 is live; everything below is DONE except the §Queued garage-showroom task, which remains open.
>
> **Why this doc exists:** the session hit its usage limit mid-build. Everything below lets
> THIS session (post-recovery) or a FRESH session finish and ship World 7 + one queued UI
> task. Recovery agents were relaunched on Opus; if their outputs exist (checked below),
> most of this is already done — verify, don't redo.

## Shipped earlier today (already live on main)
`f1d24a9` home landing page (modes are the main page, WORLDS tile, GARAGE quick-switch grid) ·
`107d740` crusher pass-through fix · `cf3347a` co-op+VS growth + bounding camera ·
`a41105d` navigation overhaul · plus everything before (see the vault note).

## W7 state at handoff

| Piece | State | Where |
|---|---|---|
| Validator + AUTHORING (L/Y/sweep rules, W7 band ≤54×36) | ✅ DONE (committed with this doc) | `tools/` |
| Levels 90-95 (2 batches) | ✅ authored + validated | scratchpad `lava_0.js`, `lava_1.js` |
| Levels 96-104 (3 batches) | 🔁 Opus recovery fleet in flight | will land as `lava_2/3/4.js` (workflow `wf_591a99de-6b4`) |
| Engine: L/Y parse, meltCar + car.meltT, sweep logic | ✅ in the WORKING TREE (uncommitted `index.html`) — syntax-valid, runtime-inert | working tree |
| Engine: melt visuals in drawCar, geyser cycle+draw, drawLava, sweep draw, prerender rim, WORLD_THEME[6] + "lava" backdrop, PHOENIX car, safety hooks (golden/checkpoint/BFS/rival) | 🔁 Opus finisher agent in flight (spec = its prompt; sections A-H) | working tree when done |
| Assembly script (levels splice + SERIES row + comingSoon retag) | ✅ ready | scratchpad `assemble_lava.js` |

**⚠️ The uncommitted `index.html` working tree is precious** — it holds the partial/finished
engine. Don't discard it. It is verified inert for all existing content (empty `game.lavas`,
`sweep:null`).

## To finish (in order)

1. **Wait/verify the two recovery tasks**: `lava_2/3/4.js` exist and each batch reported
   "3/3 valid"; the engine finisher reported SYNTAX_OK + validator all-valid + smoke passing.
2. **Assemble (atomic!)**: `node "<scratchpad>/assemble_lava.js"` — splices the 15 levels,
   inserts the SERIES row (`reward:"phoenix"`), retags the comingSoon card to 🎢.
   The SERIES row + levels + engine MUST ship in ONE commit (same reward-sequencing rule as
   World 6: a reward id without its SERIES row breaks the shop label + grant).
3. **Gates**: syntax extract + `node --check`; `node tools/validate-levels.js` → 105/105
   campaign; then in-browser (`__tm`): all 15 W7 levels load + BFS-reachable post-transform
   (treat `L` + solid as walls — reuse the sweep script pattern from the W6 ship); boss sims
   ix100 + ix104 reach F; **melt proof** (drive onto an L cell → `car.meltT>0`, control locked,
   respawns with invuln≈1.4); geyser only melts while erupting; sweep advances after delay +
   melts + pulls back 3 cells on respawn; `worldTheme().back==="lava"` on W7 + regression
   `!=="lava"` on W1-6 + VS/co-op unchanged; PHOENIX renders in the showroom; screenshot a
   lava level (money shot: molten pools + ember backdrop).
4. **README**: 90→105 levels / 6→7 worlds; add the HOT LAVA sentence to the worlds paragraph.
5. **Commit + push** (one atomic commit), then vault: Current-State bullet + session log
   line in `01_Projects/Turbo Maze.md` (+ the pattern notes below).

## Queued UI task (user-requested, not started)
**Garage = the real showroom, owned-only.** Replace `drawGarage` (the simple grid) with
"garage mode" on the existing shop showroom: entering from the HOME GARAGE tile sets
`sh.garageMode=true` then `game.state="shop"`; `shopRoster()` filters
`VEHICLES.filter(v=>store.ownedCars.includes(v.id))` when garageMode (cars only — hide the
pets tab row); price/BUY UI already no-ops for owned cars (shows the equip/RIDING flow);
title swap 🛒→🚗 GARAGE; the shop back action must clear `sh.garageMode` and return to
`"home"`. Delete `drawGarage` + its dispatch/`portraitHint` entries and route the home tile's
`act==="garage"` to the flow above. Verify: garage shows only owned (no locks/prices), equip
works, shop entered via SHOP tile still shows everything incl. buy + pets.

## Fresh-session quickstart
Read the vault note (`01_Projects/Turbo Maze.md`) + this doc + `tools/AUTHORING.md`. Scratch
dir may differ per session — if `lava_*.js` are missing, re-author per the level briefs in
workflow script `hot-lava-levels-wf_4a4fb71d-198.js` (briefs embedded). The engine spec (if
the finisher died) is in the finisher agent's prompt: melt visuals (A), triggers (B), geyser
cycle (C), draws (D), prerender rim (E), atmosphere (F), safety hooks (G), PHOENIX (H).
House rules: `fillTextC` for centered emoji text; collide where you draw; last-`S`/first-`2`
spawn rule; one writer in `index.html` at a time; verify with `__tm.step` not screenshots.
