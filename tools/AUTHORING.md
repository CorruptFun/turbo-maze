# Authoring levels for Turbo Maze

The whole game is one file: [`../index.html`](../index.html) (inline CSS + `<canvas>` + vanilla JS, no build).
Levels are ASCII grids in four arrays: `LEVELS` (campaign, grouped into worlds by `SERIES`),
`VS_ARENAS`, `KO_ARENAS`, `COOP_LEVELS`. **Every new level must pass the validator before it ships.**

## Validate (do this every time)

```bash
node tools/validate-levels.js            # regression-check all shipped levels
node tools/validate-levels.js cand.js    # check a candidate module.exports = [ {level}, ... ]
```

`❌` = a real defect (fix it). `⚠️` = advisory (e.g. a crate on the sole path — fine only for a
deliberate smashable-crate level with runway). The checks reuse the game's own reachability so a
"pass" means genuinely beatable: sealed borders, start/finish present, finish reachable, key
reachable before its door, portals 0-or-2, coins reachable, no crate walling the only path; co-op
also checks both starts on one side + gate mandatory + pads/plates reachable; KO checks safe starts
+ hazard pits.

## Workflow

1. Draft levels in a scratch `cand.js`: `module.exports = [{ name, emoji, hue, par, grid:[...] }, ...]`.
   Use `mk(W, interiorRows)` from `validate-levels.js` to avoid width bugs — write rows **without**
   borders; it seals the border and pads each row to width `W`.
2. `node tools/validate-levels.js cand.js` → fix every `❌` → repeat until clean.
3. Paste the final `grid` arrays into the right array in `index.html`.
4. Verify in the browser (see below), then commit + push to deploy.

## Tiles

`#` wall · `.` road · `~` ice (slippery) · `S` P1 start · `2` P2 start (VS/co-op/KO only) · `F` finish
· `c` coin · `n` nitro · `k` key (one per level; opens all `D`) · `D` door · `G` auto-timed gate ·
`*` boost pad · `T` portal (**exactly 0 or 2** per level) · `x` breakable crate (solid until hit at
speed — never the ONLY path) · `P` co-op plate · `Q` co-op gate (opens while a plate is held **or** the
sequence is solved) · `M`/`N` shifting walls (two anti-phase sets, never both solid) · `z` VS zap
pickup · `B` VS trap trigger · `w` VS trap wall · `!` KO hazard pit · `o` co-op sequence pad (numbered
by reading order top→bottom,left→right) · `<` `>` `^` `v` conveyor floors · `O` trap door.

## Level properties

`{ name, emoji, hue, par, grid }` plus optional:
- `rival:{mult:N}` — boss chase-car (N ≈ 1.0–1.5, harder = higher).
- `dark:true` — headlights-only night level.
- `hazards:[{path:[[c,r],[c,r]], speed}]` — patrolling goobers (waypoints in grid cells).
- `crushers:[{c,r,dx,dy,range,period,phase}]` — sliding crushers. Anchor `c,r`; slides `range` cells
  in direction `dx,dy`; `period` seconds per cycle. Not a grid tile → give it a clear lane by hand.
- `seq:[[c,r],...]` — override the co-op sequence pad order (default is reading order).

`par` = target seconds for the ⭐ speed star (≈ `1.7–2.0 ×` the BFS path length; generous for kids).

## Add a world / arena

- **New campaign world:** append 15 levels to `LEVELS`, then add
  `{ name, emoji, hue, blurb, count:15 }` to `SERIES` **before** the `comingSoon:true` card. World
  starts auto-compute and saved progress carries over (worlds only group existing indices). The
  Golden Goat unlocks on the very last `LEVELS` entry.
- **New VS/KO arena:** append to `VS_ARENAS` / `KO_ARENAS`. The VS-pick screen wraps any count.

## Verify in the browser

Serve (`python3 -m http.server 8765`) and open in the Browser pane. `window.__tm` exposes
`{ game, LEVELS, SERIES, VS_ARENAS, KO_ARENAS, COOP_LEVELS, loadLevel, startVs, startKo, startCoop,
save, step(sec) }`. The preview throttles `requestAnimationFrame`, so **drive frames deterministically
with `__tm.step(seconds)`** rather than waiting on real time. Push a test level to `__tm.LEVELS` then
`loadLevel(idx)`. Confirm: `node --check` on the extracted `<script>`, no console errors, and actually
drive a car through each new mechanic to the finish. Test at 1024×720, iPad 1180×820, iPhone-landscape
956×440.

## Deploy

Commit to `main` and `git push` (GitHub Pages `CorruptFun/turbo-maze` auto-redeploys the live link).
Update `../README.md`, then log the session to the brain vault (`01_Projects/Turbo Maze.md`
Current State + a `05_Chat_Logs/` entry) and commit the vault.
