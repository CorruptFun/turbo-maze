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
by reading order top→bottom,left→right) · `<` `>` `^` `v` conveyor floors · `O` trap door ·
`@` gravity well (**solid** core — the pull is runtime; validator treats it as wall) · `0` black-hole
wormhole (**pairs: exactly 0 or 2** per level, **XOR with `T`** — never both, they share the portal
pair) · `V` void (transparent chasm — **wall for ground reachability**, cross only by launch ring;
campaign-only) · `U` launch ring (passable pad that flings the car airborne along its heading) ·
`L` molten lava pool (**wall for every reachability check** — a car can never drive it, it melts;
the validator normalizes `L` to `#`) · `Y` geyser vent (passable timed hazard — dormant most of
its cycle, erupts on a timer; World 7).

## Level properties

`{ name, emoji, hue, par, grid }` plus optional:
- `rival:{mult:N}` — boss chase-car (N ≈ 1.0–1.5, harder = higher).
- `dark:true` — headlights-only night level.
- `hazards:[{path:[[c,r],[c,r]], speed}]` — patrolling goobers (waypoints in grid cells).
- `crushers:[{c,r,dx,dy,range,period,phase}]` — sliding crushers. Anchor `c,r`; slides `range` cells
  in direction `dx,dy`; `period` seconds per cycle. Not a grid tile → give it a clear lane by hand.
- `seq:[[c,r],...]` — override the co-op sequence pad order (default is reading order).
- `asteroids:[{c,r,dx,dy,range,period,phase,size}]` — drifting space rocks (World 6). Anchor `c,r`;
  drifts `range` cells along `dx,dy`; `period` seconds per cycle; `phase` 0–1 offset; `size` in cells.
  Runtime prop like crushers — not a grid tile, invisible to the validator, so lane-clear by hand.
- `sweep:{dir,speed,delay}` — lava sweep wave (World 7): a wall of lava that scrolls across the level
  in direction `dir` at `speed` cells/s after `delay` seconds. Runtime prop like crushers/asteroids —
  not a grid tile, invisible to the validator, so verify beatability by hand (see W7 guardrails).

`par` = target seconds for the ⭐ speed star (≈ `1.7–2.0 ×` the BFS path length; generous for kids).

## World 6 (space) authoring guardrails

- **Ground-solvable contract:** treating `@` and `V` as walls and using NO ring/hop/warp, a solid
  road must connect S→F on every level. Rings, wormholes, and slingshots are pure optional
  shortcuts (the validator hard-fails a void-only bridge).
- **Ring leaps:** chasm gap **≤ 2 cells**, landing island **≥ 2 cells deep** (absorbs the slightly
  longer flight of upgraded cars).
- **Black holes near S/F:** never place a `0` horizon adjacent to S or F — the inner horizon is
  intentionally inescapable-without-nitro and could warp a kid away from the flag repeatedly. The
  validator does NOT catch this.
- **Boss races:** keep the rival's ideal BFS ground line clear of wells (`@`) and rings (`U`) — the
  rival isn't pulled by wells and ignores rings, so hazards on its line only punish the kid.
- **Asteroids vs boss corridors:** never seal a boss's sole corridor with an asteroid — stagger
  `phase` (e.g. 0/0.33/0.66) so a timing gap is always open.

## World 7 (HOT LAVA) authoring guardrails

- **Lava never surrounds the only route:** `L` is a hard wall for reachability — the validator
  enforces this automatically (it normalizes `L` to `#` before every check), so a lava-walled-off
  flag hard-fails with CAN'T REACH.
- **Geysers are fair timing hazards:** every `Y` vent must be dormant for **≥ 60% of its cycle** —
  a kid who waits always gets a generous window. The validator treats `Y` as passable floor; the
  timing fairness is on the author.
- **Sweep levels must be beatable at CRUISE speed:** the sweep must lose to a cruising kid with
  **≥ 25% margin** — check `BFS path length / 3.4 cells-per-sec` (CRUISE) against the sweep's
  arrival time and keep the margin ≥ 25%. The `sweep` prop is validator-invisible, so verify by hand.
- **Boss rival corridors lava-free:** keep the rival's ideal BFS line clear of `L` (and erupting
  `Y` timing traps) — like wells in World 6, hazards on its line only punish the kid.
- **Sweep speed on boss levels ≤ 1.0 cells/s:** a boss race already pressures the kid; a fast
  sweep on top makes it unfair.

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

## Maze sizing — the growth curve (2026-07-16)

Worlds grow **bigger and more complex the deeper you go** (dad's directive: the game
should challenge you as you get better). W1 stays small (tutorial). Shipped bands
(opener → finale, ramp linearly across a world's 15 levels):

| World | Opens | Finale |
|---|---|---|
| 2 BRAIN FREEZE | ~26×15 | 26×14 |
| 3 MAZE MAYHEM | ~26×14 | 32×17 |
| 4 METAL MELTDOWN | ~28×15 | 38×21 |
| 5 SPLASH ZONE | ~34×18 | 44×25 |
| 6 COSMIC RUSH | ~36×19 | **52×34** (≈8.8× the pre-growth late game) |
| 7 HOT LAVA | ~38×20 | **54×36** |

**A future World N should open bigger than World N-1 opened** and finale past it.
Hard caps: width ≤ 54, height ≤ 36 (the engine resolution cap below absorbs it). Complexity scales
with size: real branching, loops, coin-rewarded dead-ends — something interesting
every ~6-8 cells, never barren corridors. `par` = `Math.ceil(BFSpath*1.9/2)*2`.

Engine facts that make giants safe (don't re-invent):
- **🚩 Auto-checkpoints** (engine, automatic): any campaign level whose S→F path is
  **> 24 cells** silently moves the respawn to the halfway mark when the player
  crosses it on safe ground. Authors get this for free — no tile. Two-player modes
  are excluded by design.
- **📐 Resolution cap** (engine, automatic): ground + skid prerender canvases cap at
  12M px (`game.groundScale` < 1 on giants, blitted up) so iOS canvas limits can't
  be hit. Nothing for authors to do — but don't exceed the 52×34 grid caps.

## Authoring gotchas (learned the hard way — check these before shipping)

- **VS fairness / engine spawns:** the parser keeps the **LAST `S`** (loop overwrites)
  and the **FIRST `2`** (guarded by `!p2x`). Any fairness/distance math using
  `findIn` (first match) is subtly wrong. Gate every VS grid change with
  |d(lastS→F) − d(first2→F)| ≤ 1 by walls-only BFS.
- **Canvas text with emoji** (if you touch UI): always `fillTextC(txt,x,y,stroked)` for
  centered strings and size containers with `+ emojiPad(txt)` — iOS WebKit mis-centers
  emoji glyph runs (paints right of the anchor).
- **Maze variety** mirrors/rotates every W2+ level at load: directional data
  (`crushers`, `hazards`, `asteroids` dx/dy, `seq`) is auto-reflected by
  `transformLevel` — but only for props it knows. A new coordinate-carrying prop
  needs its own reflect line there.
- **gateFinish** (runtime) seals the finish behind the door on key/door levels —
  author them loosely, it verifies per level.

## Deploy

Commit to `main` and `git push` (GitHub Pages `CorruptFun/turbo-maze` auto-redeploys the live link).
Update `../README.md`, then log the session to the brain vault (`01_Projects/Turbo Maze.md`
Current State + a `05_Chat_Logs/` entry) and commit the vault.
