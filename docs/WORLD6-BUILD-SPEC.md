# WORLD 6 — 🌌 COSMIC RUSH — CONSOLIDATED BUILD SPEC

**Single source of truth for the coder.** Target files:
- `/Users/lucid/Creative/maze game/index.html` (all engine + data)
- `/Users/lucid/Creative/maze game/tools/validate-levels.js` (validator)
- `/Users/lucid/Creative/maze game/tools/AUTHORING.md` (docs)

**One-line goal:** insert World 6 (COSMIC RUSH, space) into `SERIES` *before* the 🌋 comingSoon card → a 90-level / 6-world campaign (global indices 75–89). New primitive = **FORCES**: the first continuous pull toward a point (gravity). Everything reuses an existing seam; every non-W6 world/mode is a bit-for-bit no-op.

**Every edit below is anchored by an exact live-code STRING (verified this session), not a line number** — line numbers drift, strings do not. Implement top-to-bottom; sections are in dependency order.

---

## TECH-LEAD MERGE RULINGS (the conflicts the sub-specs disagreed on — resolved, decisive)

| # | Conflict | RULING | Why |
|---|----------|--------|-----|
| M1 | Wormhole glyph: reuse `T` (world spec) vs NEW `0` w/ `bh:true` (gravity spec) | **NEW `0` + `bh:true`** | Behavior travels with the data → unit-testable, no `seriesOf===5` runtime branch, explicit validator pair-rule. Plain `T` stays available. |
| M2 | Launch-ring glyph: `R` (void spec) vs `U` (world spec) | **`U`** | Reads as ring/ramp mouth; avoids future R-for-Rocket/Reward collision. Cosmetic, no code impact. |
| M3 | Asteroids: soft `game.asteroids[]` via `L.asteroids[]` (asteroid spec) vs solid `L.crushers[]` reskin (world spec) | **SOFT `game.asteroids[]`** | A moving *solid* can pin a 7-yo in a corridor and reads as an invisible wall — fails the forgiving/wonder brief. Soft rock bumps+spins, never wedges. |
| M4 | Low-G grip: 3.4 (feel spec) vs 2.6 (world/forces map) | **3.4** | Overlap of both safe bands; still 3× more planted than ice (τ≈0.29s). Feel spec is the dedicated owner. |
| M5 | Low-G maxSp: ×1.15 (world/forces) vs UNCHANGED (feel spec) | **UNCHANGED (×1.0)** | Higher top speed + looser grip is the one combo that *reduces* a kid's control, in a world full of chasms. Float is a feel, not a speed bump. |
| M6 | UFO reward stats: keep {6,5,7,8} (world spec) vs bump {7,6,9,9} (ufo spec) | **BUMP to {7,6,9,9}** (A-class 775) | A B-class prize for the final/brainiest world reads backward next to every earlier reward car (all A-class). One revertable line. |
| M7 | Void mask field name: `game.isVoid` vs `game.voidCell` | **`game.voidCell`** | Avoids the `void` reserved-word footgun; clearer. |
| M8 | Well pull vs low-G accel escapability tie | **Compose as-is; playtest-flag** | Quadratic falloff + SOLID core means the max pull a car experiences before bumping the core ≈ 385–430 px/s² < cruise thrust 542 px/s² (750×0.85×0.85). Escapable. See §9. |

---

## 1. FINALIZED TILE CHARS

In-use alphabet (must NOT collide): `# . ~ S 2 F c n * G D k T x P Q M N z B w ! o < > ^ v O J & %`

| Char | Name | Kind | Solid? | State | Directional? | In builder? |
|------|------|------|--------|-------|--------------|-------------|
| `@` | 🪐 GRAVITY WELL / planet | continuous pull field, SOLID core | **YES** (core collides like `#`) | `game.wells[]` | No (in-grid point) | **No** |
| `0` | 🕳️ BLACK HOLE / wormhole end | passable floor + strong suction + warp; reuses portal pair, `bh:true` | No | `game.portals[]` (with `bh:true`) | No | **No** |
| `V` | 🕳️ VOID / chasm | passable floor that respawns you; renders transparent | No | `game.voids[]` + `game.voidCell[r][c]` mask | No | **No** |
| `U` | 🚀 LAUNCH RING | flings car airborne along `car.heading` | No (drivable pad) | `game.rings[]` | No (flies along heading) | **No** |
| — | ☄️ ASTEROID | soft drifting rock, timing dodge | **No** (soft circle) | `game.asteroids[]` (from `L.asteroids[]` level prop) | dx/dy in data → needs transform reflect (§2.J) | n/a (runtime prop) |

**Collision check:** `@ 0 V U` are all free vs the in-use set. `0`-vs-`O` monospace confusion is mitigated (`O` is World-4-only, never co-occurs; parser + validator treat them as distinct; the `0` pair-count check flags a lone typo). `V`-vs-lowercase-`v`: grids are case-sensitive; distinct.

**All four grid glyphs are NON-DIRECTIONAL in-grid point positions** → `swapDirs` (only rewrites `< > ^ v`) passes them through and `transformLevel` mirrors/rotates them as a rigid isometry with zero new swap pairs. Asteroids are the ONE exception (data carries dx/dy) and get an explicit reflect line (§2.J).

**Wormhole rule (validator-enforced):** a level uses `0` **XOR** `T`, never both — they share `game.portals`. `0` count must be exactly 0 or 2.

---

## 2. ENGINE CHANGES (index.html) — dependency order

> Insert points are named by the exact live string to match. `dt`, `CELL`, `TAU`, `SPD=CONFIG.speed||1`, `clamp`, `dist`, `rand`, `pick`, `sparkle`, `puff`, `debris`, `float`, `sticker`, `blockHit`, `AU.nitro`, `AU.beep(freq,dur,type,vol,slideTo)`, `AU.bonk` are all existing helpers.

### 2.A — Field constants (near `const CRUMBLE_GRACE`)
Add after the CRUMBLE_GRACE const:
```js
const WELL_R      = 2.6*CELL;   // 286px well pull radius
const WELL_PULL   = 560;        // peak px/s² near core (×SPD; quadratic falloff → effective ~385-430 experienced)
const BH_R        = 1.7*CELL;   // 187px black-hole suction radius
const BH_CAP      = 42;         // event-horizon capture radius (px)
const BH_PULL_MIN = 260;        // suction at rim  (×SPD)
const BH_PULL_MAX = 1150;       // suction at core (×SPD)
```

### 2.B — YELLS (asteroid celebration)
At the `YELLS` object, add a `rock` array (mirrors `YELLS.goober`):
```js
rock: ["SPACE ROCK!","BONK!","WHOA!","ASTEROID!"],
```

### 2.C — State resets (`startLevel`) — beside `game.bounces = []; game.crumbles = [];`
Append on/after that line (runs unconditionally in ALL modes → no read ever throws):
```js
game.wells = []; game.voids = []; game.rings = []; game.asteroids = [];
game.voidCell = [];   // 2D void mask, built per-row alongside game.solid
```

### 2.D — Per-row mask init — beside `game.solid[r]=[]; game.slick[r]=[]; game.sticky[r]=[];`
Append: `game.voidCell[r]=[];`

### 2.E — Parse loop — make `@` SOLID + build masks
Change the wall test (`const wall = ch==="#";`) to:
```js
const wall = ch==="#" || ch==="@";   // 🪐 planet core collides like a wall — bump, never die
```
This cascades for free: `game.solid[r][c]=1`, excluded from `game.road` (via `if(!wall)`), so `isSolid`/`collideWalls` bump the car (soft 1.35 bounce), the stuck-hint flow field routes around it, and `bfsPathCells` routes the rival around it — **no `isSolid` edit needed.**

Beside the slick/sticky mask assignments, add:
```js
game.voidCell[r][c] = ch==="V" ? 1 : 0;
```
Change the road-push line (`if(!wall) game.road.push([c,r]);`) to exclude void:
```js
if(!wall && ch!=="V") game.road.push([c,r]);   // 🕳️ void is not drivable "road" (no coins/overlays in the gap)
```

### 2.F — Parse loop — entity pushes (after the `%` foam handler, last tile before loop closes)
```js
if(ch==="@") game.wells.push({c,r,x:wx,y:wy,ph:Math.random()*TAU});                 // 🪐 well (core solidified above)
if(ch==="0") game.portals.push({c,r,x:wx,y:wy,cool:0,bh:true});                     // 🕳️ black-hole wormhole end
if(ch==="V") game.voids.push({c,r,x:wx,y:wy,ph:Math.random()*TAU});                 // 🕳️ chasm
if(ch==="U") game.rings.push({c,r,x:wx,y:wy,cool:0,ph:Math.random()*TAU});          // 🚀 launch ring
```
The existing `game.portals.length = Math.min(2, game.portals.length);` cap already enforces exactly one wormhole pair.

### 2.G — `game.lowG` flag (`startLevel`) — beside `game.vs`/`game.ko`/`game.coop`
```js
game.lowG = !!(game.lv && game.lv.lowG) ||
            (game.levelIx>=0 && !game.customId && seriesOf(game.levelIx)===5);   // 🌠 W6 world-wide float
```
Reassigned every load → always boolean, no stale leak. VS/KO/co-op/custom → `levelIx===-1` or `customId` set → FALSE.

### 2.H — Asteroid build (`startLevel`) — after the crusher build `.forEach`
```js
(L.asteroids||[]).forEach(a=> game.asteroids.push({
  c:a.c, r:a.r, dx:a.dx||0, dy:a.dy||0, range:a.range||3,
  period:(CONFIG.easyMode? (a.period||3.6)*1.25 : (a.period||3.6)),
  phase:a.phase||0, size:a.size||1, off:0,
  x:(a.c+0.5)*CELL, y:(a.r+0.5)*CELL,
  spin:Math.random()*TAU, spv:(Math.random()<0.5?-1:1)*(0.5+Math.random()*0.6) }));
```
Authoring format: `L.asteroids:[{c,r,dx,dy,range,period,phase,size}]` — `c,r` origin; `dx,dy` unit drift (both non-zero = diagonal tumble); `range` cells swept; `period` sec/cycle; `phase` 0..1; `size` 1 (default) or 2 (boulder, wide straights only).

### 2.I — Rival build (`startLevel`) — routing + UFO flag
At the `trapAvoid` construction (`new Set(game.trapDoors.map(...))`, where crumbles are also added), append:
```js
for(const p of game.portals) if(p.bh) trapAvoid.add(p.c+","+p.r);   // 🕳️ boss routes around black holes (no pull, no warp)
```
Voids need **no** trapAvoid line — §2.O ORs the void mask directly into `bfsPathCells`.

On the `game.rival = {...}` literal, compute + pass the UFO flag:
```js
const rivalUfo = !!(L.rival && L.rival.ufo) ||
  (game.levelIx>=0 && !game.customId && seriesOf(game.levelIx)===5);
game.rival = { wp: ..., i:0, x:..., y:..., a:head,
  speed:(CONFIG.bossSpeed||95)*((L.rival&&L.rival.mult)||1), delay:1.5, done:false, ufo:rivalUfo };
```

### 2.J — `transformLevel` — asteroid reflect (MANDATORY; the one real cost of the soft-array design)
After the crusher reflect line, add (confirm the exact `mapC`/`mapR`/`h`/`v` helper names at that block first):
```js
if(L.asteroids) out.asteroids = L.asteroids.map(a => Object.assign({}, a,
  { c:mapC(a.c), r:mapR(a.r), dx: h? -(a.dx||0):(a.dx||0), dy: v? -(a.dy||0):(a.dy||0) }));
```
W6 is `seriesOf===5 ≥ 1` so `varyMaze` WILL flip these — omitting this line desyncs rocks from the mirrored maze. `@ 0 V U` need no such line (non-directional glyphs reflect for free).

### 2.K — Cooldown ticks (global, `updateEntities`, beside the portal/bounce cooldown ticks)
```js
for(const rg of game.rings) if(rg.cool>0) rg.cool = Math.max(0, rg.cool-dt);   // 🚀 launch-ring cooldown
```
(Black-hole `p.cool` decays on the existing `for(const p of game.portals) if(p.cool>0) p.cool -= dt;` line — already covers `bh` portals.)

### 2.L — Asteroid movement (global, after the crusher slide loop)
```js
for(const a of game.asteroids){
  const off = a.range * (0.5 - 0.5*Math.cos(((game.gt||0)/a.period + a.phase)*TAU));  // crusher math, NO round → smooth
  a.off = off;
  a.x = (a.c + a.dx*off + 0.5)*CELL;
  a.y = (a.r + a.dy*off + 0.5)*CELL;
  a.spin += dt * a.spv;
  if(off>0.15 && off<a.range-0.15 && Math.random()<0.22) puff(a.x, a.y, "rgba(201,179,255,0.35)");
}
```
Reads `game.gt` → ⏱️ slow-mo aware for free. Default range 3 / period 3.6 → peak mid-lane speed ≈ 288 px/s (< cruise cap 340); cosine eases to near-stop at both lane ends = free telegraph.

### 2.M — FORCE BLOCKS (per-car loop, immediately AFTER the conveyor block)
```js
// 🪐 gravity wells: continuous quadratic pull toward each planet — bend the line, whip the corner. Always escapable.
{ const SPD = CONFIG.speed||1, airK = car.airT>0 ? 0.5 : 1;   // gentle bend on ring-hops, full grip on ground
  for(const w of game.wells){
    const dx=w.x-car.x, dy=w.y-car.y, d=Math.hypot(dx,dy)||1;
    if(d > WELL_R) continue;
    const f = 1 - d/WELL_R;
    const G = WELL_PULL*SPD * f*f * airK;        // QUADRATIC: barely tugs mid-range, firm slingshot near core
    car.vx += dx/d*G*dt; car.vy += dy/d*G*dt;
    if(car===game.car && d < WELL_R*0.4 && Math.random()<0.2) sparkle(car.x+rand(-8,8), car.y+rand(-8,8));
  }
}
// 🕳️ black holes: strong grounded suction toward the horizon. A launch-ring hop (airT>0) sails clean over the top.
if(car.airT<=0){
  const SPD = CONFIG.speed||1;
  for(const p of game.portals){
    if(!p.bh || p.cool>0) continue;
    const dx=p.x-car.x, dy=p.y-car.y, d=Math.hypot(dx,dy)||1;
    if(d > BH_R || d <= BH_CAP) continue;        // inside BH_CAP the teleport block owns it
    const f = 1 - d/BH_R;
    const G = (BH_PULL_MIN + (BH_PULL_MAX-BH_PULL_MIN)*f) * SPD;
    car.vx += dx/d*G*dt; car.vy += dy/d*G*dt;
  }
}
```
**Decision — wells pull airborne cars too** (½ strength via `airK`), so ring-leaps and slingshots visibly bend (the world's signature wonder). Safe: airborne skips `collideWalls` so flying over the solid core can't wedge; `airT` decays; gentle peak << thrust. Black holes give ZERO airborne pull (only grounded capture) → a ring can leap clean over one.

### 2.N — VOID respawn (per-car loop, after the foam block)
```js
// 🕳️ THE VOID: drift into open space → gentle beam-back (a launched hop with airT>0 sails over)
if(game.voids.length && car.invuln<=0 && car.airT<=0){
  const vcx=Math.floor(car.x/CELL), vcy=Math.floor(car.y/CELL);
  if(game.voidCell[vcy] && game.voidCell[vcy][vcx] && !blockHit(car, car.x, car.y)){
    const sp = car.spawn || {x:car.x, y:car.y, h:car.heading};
    for(let i=0;i<16;i++) puff(car.x+rand(-14,14), car.y+rand(-14,14), "rgba(180,170,255,0.5)");
    car.x=sp.x; car.y=sp.y; car.heading=sp.h; car.vx=car.vy=0; car.invuln=1.4; car.spinT=0.35; car.sq=0.5;  // respawn contract
    AU.beep(300,0.14,"sine",0.10,540); AU.beep(760,0.28,"sine",0.12,220);   // soft rising beam-back warble — NOT AU.bonk
    game.shake=Math.min(5,game.shake+2);
    sticker("🌌 "+(game.vs||game.coop||game.ko? pName(car.p2?1:0)+" DRIFTED OFF!":"DRIFTED INTO SPACE — BEAMED BACK!"), "#7b6cff");
  }
}
```
Guards `invuln<=0 && airT<=0`: i-frames block re-trigger; airborne (ring hop) sails across. `blockHit` lets 🛡️/👻 absorb the fall. The 5-assignment respawn contract is identical to the foam/trap-door blocks. Respawns to `car.spawn` — validator (§6) guarantees a ground route always exists.

### 2.O — VOID = WALL for all pathfinding (OR the mask into the BFS calls — covers boss + golden crate in one seam)
- **`bfsPathCells`** skip condition — append the void term to the existing `||game.solid[nr][nc]||...` chain:
  ```js
  ...||game.solid[nr][nc]||(game.voidCell[nr]&&game.voidCell[nr][nc])||prev[nr][nc]||(avoid&&avoid.has(nc+","+nr))) continue;
  ```
  This one call powers BOTH the boss racing line AND the golden-crate racing line → both route around voids, zero extra code. The existing `path.length<=1` fallback still handles "void unavoidable."
- **`updateObjective` flow field** (stuck-hint) — add void to its skip: `if(game.solid[nr][nc] || (game.voidCell[nr]&&game.voidCell[nr][nc])) continue;`
- **`finishDist`** BFS (chevron orient) — add void: `if(isWallCell(nc,nr) || (game.voidCell[nr]&&game.voidCell[nr][nc])) continue;`
- **Do NOT** add void to `rivalBlocked` (that's for wait-out timing obstacles). **Do NOT** touch `collideWalls` (void stays drivable-into). `@` is already `game.solid` → BFS avoids it free.

### 2.P — LAUNCH RING (per-car loop, after the splash-pad block)
```js
// 🚀 LAUNCH RING: big floaty space-leap across a chasm — reliable ~3.1–3.5 cells every time
if(game.rings.length){
  const rcx=Math.floor(car.x/CELL), rcy=Math.floor(car.y/CELL);
  for(const rg of game.rings){
    if(rg.c===rcx && rg.r===rcy && rg.cool<=0 && car.airT<=0){
      rg.cool=0.5;
      const SPD=CONFIG.speed||1, sp=Math.hypot(car.vx,car.vy);
      const launch = clamp(sp + 380*SPD, 560*SPD, 640*SPD);   // upper clamp = airborne maxSp cap → nothing clipped
      car.vx=Math.cos(car.heading)*launch; car.vy=Math.sin(car.heading)*launch;   // fly the way you POINT (flip-safe)
      car.airT=car.airMax=0.82;
      car.nitroMeter=Math.min(100,car.nitroMeter+20); car.sq=1.4;
      AU.nitro(); AU.beep(320,0.10,"sawtooth",0.10,720); game.shake=Math.min(7,game.shake+4);
      for(let i=0;i<14;i++) puff(rg.x+rand(-18,18), rg.y+rand(-18,18), "rgba(159,224,255,0.6)");
      if(car===game.car) float("BLAST OFF!", car.x, car.y-42, "#9fe0ff");
      break;
    }
  }
}
```
At SPD 0.85: launch 476–544 px/s (upper clamp 640×0.85=544 = airborne maxSp cap → nothing clipped); flight ≈ 339–388 px ≈ **3.1–3.5 cells reliably**. Landing is free: overshoot→normal splashdown; land-in-wall→existing nearest-open-cell eject; undershoot-into-void→§2.N warps home. **Authoring rule: chasm gap ≤ 2 cells, landing island ≥ 2 cells deep.**

### 2.Q — WORMHOLE teleport (modify the existing TELEPORT block: widen `bh` capture + dramatize warp)
Replace the inner body of the existing `if(game.portals.length===2 && car.portalCool<=0){ for(let i=0;i<2;i++){ const p=game.portals[i]; ...` with:
```js
const cap = p.bh ? BH_CAP : 34;
if(p.cool<=0 && dist(car.x,car.y,p.x,p.y)<cap){
  const o = game.portals[1-i];
  if(p.bh){                                             // 🌀 event-horizon → white-hole warp
    for(let k=0;k<18;k++) sparkle(p.x+rand(-20,20), p.y+rand(-20,20));
    car.x=o.x; car.y=o.y; car.portalCool=1.1; o.cool=0.6;
    car.spinT=0.4; car.sq=0.5;
    for(let k=0;k<20;k++) puff(o.x+rand(-22,22), o.y+rand(-22,22), "rgba(180,150,255,0.6)");
    AU.nitro(); game.shake=Math.min(7,(game.shake||0)+4);
    float("WARP!", o.x, o.y-32, "#c9b6ff");
  } else {                                              // unchanged plain-portal path
    for(let k=0;k<10;k++) puff(car.x,car.y,"rgba(185,140,255,0.55)");
    car.x=o.x; car.y=o.y; car.portalCool=1.1; o.cool=0.6;
    for(let k=0;k<10;k++) puff(car.x,car.y,"rgba(185,140,255,0.55)");
    AU.nitro(); float("WOOSH!", car.x, car.y-30, "#b98cff");
  }
  break;
}
```
The `car.portalCool=1.1` / `o.cool=0.6` handshake already prevents any pull-loop or instant re-warp.

### 2.R — ASTEROID collision (per-car loop, after the goober collision block)
```js
for(const a of game.asteroids){
  if(car.airT>0) continue;                              // 🚀 ring hop sails over
  const rr = 30*a.size;
  if(dist(car.x,car.y,a.x,a.y) < rr && car.invuln<=0 && !blockHit(car,car.x,car.y)){
    car.invuln = 1.0*a.size; car.spinT = 0.4; car.sq = 0.6;
    game.shake = Math.min(8, game.shake+6); AU.bonk(); AU.beep(180,0.22,"sawtooth",0.14,70);
    sticker("☄️ "+pick(YELLS.rock), "#c9b3ff");
    const ka = Math.atan2(car.y-a.y, car.x-a.x), kb = 300*a.size;
    car.vx = car.vx*0.4 + Math.cos(ka)*kb;              // keep 40% forward + outward pop = EJECTION, never a dead stop
    car.vy = car.vy*0.4 + Math.sin(ka)*kb;
    a.spin += 0.7;
    for(let i=0;i<10;i++) debris(a.x+rand(-18,18), a.y+rand(-18,18));
    for(let i=0;i<6;i++)  puff(car.x, car.y, "rgba(201,179,255,0.5)");
  }
}
```
Draw radius == collision radius (what you see is what hits). Shortest i-frames of any hazard = bounciest recovery.

### 2.S — RIVAL vs hazards
- **Wells** — bounded nudge, in the waypoint follower's advance branch (after the normal move toward next waypoint):
  ```js
  for(const w of game.wells){
    const dx=w.x-rv.x, dy=w.y-rv.y, d=Math.hypot(dx,dy)||1;
    if(d > WELL_R) continue;
    const f=1-d/WELL_R, pull=Math.min(WELL_PULL*(CONFIG.speed||1)*f*f*dt, rv.speed*dt*0.6);  // ≤60% of a forward step
    const nx=rv.x+dx/d*pull, ny=rv.y+dy/d*pull;
    if(!isSolid(Math.floor(nx/CELL),Math.floor(ny/CELL))){ rv.x=nx; rv.y=ny; }
  }
  ```
  Cap → forward progress always dominates (can't orbit-stall, always reaches F); `isSolid` guard → never clips the core.
- **Asteroids** — in `rivalBlocked`, after the crusher line:
  ```js
  for(const a of game.asteroids){ const ac=Math.round(a.c+a.dx*a.off), ar=Math.round(a.r+a.dy*a.off);
    if(ac===c && ar===r) return true; }
  ```
  Boss waits out the rock on its rounded cell (a ping-pong lane always clears). **Authoring guard: never seal the boss's SOLE corridor** — phase-stagger multiples so an open frame always exists.
- **Black holes / voids** — no pull, no warp; already routed around via §2.I (trapAvoid) + §2.O (void mask in bfsPathCells).

### 2.T — RENDERING dispatch
- **Well** (floor level, so the pull ring sits UNDER the car) — after the trap-door draw dispatch:
  `for(const w of game.wells) drawWell(w);`
- **Portals** — change the dispatch to split by `bh`:
  `game.portals.forEach((p,i)=> p.bh ? drawBlackHole(p,i) : drawPortal(p,i));`
- **Void** (after the ground blit `ctx.drawImage(game.groundCv,0,0)`, over the transparent hole, under entities):
  `for(const v of game.voids) drawVoid(v);`
- **Ring** (floor level, beside the foam draw):
  `for(const rg of game.rings) drawRing(rg);`
- **Asteroid lane + rock** (after the crusher draw dispatch):
  `for(const a of game.asteroids) drawAsteroidLane(a);` then `for(const a of game.asteroids) drawAsteroid(a);`

### 2.U — DRAW FUNCTIONS (world-space, near the existing hazard draws)
- **`drawWell(w)`** — 3 layers: (1) dashed glowing PULL-RADIUS RING at `WELL_R` in accent `#b9a8ff`, slow-rotating, alpha-pulse (the field made visible — most important element); (2) radial-gradient planet sphere (~R42) filling the solid cell, thin rim-light, 2–3 orbiting moon-dots on `game.t*2.5 + i`; (3) faint in-fall dust drifting toward center.
- **`drawBlackHole(p,i)`** — split by index for drama: `i===0` (black) dark radial `#05040a` core, 3 accretion arcs rotating INWARD (`ctx.rotate(game.t*1.6)`), faint suction ring at `BH_R`; `i===1` (white) bright inverse, arcs rotating OUTWARD, occasional outward sparkle. Bidirectional functionally; tint is directional flavor.
- **`drawVoid(v)`** — animated star-motes drifting + faint spinning galaxy swirl (clone `drawTrapDoor`'s rotating-arc pattern, recolored cyan/violet, NO black disc — the hole is transparent). Draws in WORLD coords (v.x/v.y) so motes sit inside the transformed hole.
- **`drawRing(rg)`** — pulsing double torus (outer `#7b6cff`, inner cyan), rotating sparkle-dashes, ground halo, brightens as `rg.cool→0`. PLUS a faint DOTTED TRAJECTORY ARC in the corridor-forward direction (via `finishDist()`, same as the boost-pad chevron) so a kid reads where they'll land before committing.
- **`drawAsteroidLane(a)`** — dashed line origin→(c+dx*range, r+dy*range)*CELL, `setLineDash([10,12])`, `rgba(201,179,255,0.12)`, lineWidth ~6 (the anticipation telegraph).
- **`drawAsteroid(a)`** — clone `drawCrusher`/`drawGoober` scaffold: soft deck-shadow ellipse → `ctx.rotate(a.spin)` → lumpy 9-vertex polygon R=30*size with deterministic per-rock wobble (`rr=R*(0.8+0.2*Math.sin(a.c*3+i*2.1))`) → 3 craters `#544e5c` → body `#5a5470`, stroke `#3a3440` w4 → STAR-WHITE rim-light arc `rgba(255,255,255,0.5)`. size:2 gets a faint orange ember glow. Draw radius == collision radius (fairness).
- **Slingshot reward (optional, recommended):** track per-car `car.wellIn` bool; on exit above ~300 px/s → `float(pick(["SLINGSHOT!","WHEEE!","ORBIT!"]), …)` + sparkles.

### 2.V — LOW-G physics scalar (`updateCar`) — fold `lowG` LAST into the four ternaries
Read once, after the `onSticky` read: `const lowG = game.lowG;`
Then edit (anchored by exact live strings — verified this session):
1. **grip** — `... : (turningHard && sp>230*SPD) ? 2.4 : 8.5) * mGrip * kGrip;` → change `: 8.5)` to `: lowG ? 3.4 : 8.5)`. (Do NOT nest into the hard-drift `2.4` arm.)
2. **accel** — `...(onIce?0.55: onSticky?0.7 :1);` → `...(onIce?0.55: onSticky?0.7 : lowG?0.85 :1);`
3. **coast drag** — `... : Math.exp(-(onIce?0.7: onSticky?5.5 :2.2)*dt);` → change `onSticky?5.5 :2.2` to `onSticky?5.5 : lowG?1.1 :2.2` (COAST branch only; the on-throttle `0.35` untouched).
4. **drift celebration** — `car.drifting = (slip>0.32 && spd2>210*SPD) || (onIce && spd2>140 && slip>0.2);` → append `|| (lowG && spd2>180*SPD && slip>0.22);`
5. **maxSp** — **UNCHANGED** (ruling M5). Do NOT add any `*(lowG?...)` factor.
Steering/turn-rate untouched → kid can always redirect. Friction-only: never sets `airT`, never skips `collideWalls`. Safe band: grip 3.0–4.0, coast 0.9–1.3, accel 0.82–0.9, maxSp 1.0.

### 2.W — PRERENDER transparent chasms + warning rail + well skip (`prerenderGround`)
1. **Well wall skip** — in the wall-render loop (the `if(!game.solid[r][c]) continue;` pass), add so a planet renders as a sprite over floor, not a brick pillar:
   ```js
   if(game.wells.some(v=>v.c===c && v.r===r)) continue;
   ```
2. **Void-edge WARNING RAIL** — after the walls loop, bright lip on every road edge that drops into space:
   ```js
   for(const [c,r] of game.road){
     const vz=(cc,rr)=> (game.voidCell[rr] && game.voidCell[rr][cc]);
     const px=c*CELL, py=r*CELL; x.fillStyle="#9fe0ff"; x.globalAlpha=0.85;
     if(vz(c,r+1)) x.fillRect(px,py+CELL-5,CELL,5); if(vz(c,r-1)) x.fillRect(px,py,CELL,5);
     if(vz(c+1,r)) x.fillRect(px+CELL-5,py,5,CELL); if(vz(c-1,r)) x.fillRect(px,py,5,CELL);
     x.globalAlpha=1;
   }
   ```
3. **Punch transparent + violet rim** — immediately before the final `game.groundCv = g;`:
   ```js
   for(const v of (game.voids||[])){
     x.clearRect(v.c*CELL, v.r*CELL, CELL, CELL);                 // reveal deep space
     const rim = x.createRadialGradient(v.x,v.y,CELL*0.30, v.x,v.y,CELL*0.52);
     rim.addColorStop(0,"rgba(0,0,0,0)"); rim.addColorStop(0.82,"rgba("+T.glow+",0.22)"); rim.addColorStop(1,"rgba("+T.glow+",0)");
     x.fillStyle=rim; x.fillRect(v.x-CELL*0.6, v.y-CELL*0.6, CELL*1.2, CELL*1.2);
   }
   ```
   `clearRect` at the END (after all speck/lamp/dash passes) wipes anything that landed on a void cell in one robust pass — no scattered guards needed. Walls already skip void cells. `T` is bound as `worldTheme()`; `x` is the offscreen ctx; `v.x/v.y` are cell world-centers.

### 2.X — WORLD_THEME[5] (append before the closing `];` after the SPLASH ZONE entry)
```js
// 5 COSMIC RUSH — deep space (indigo / violet, star-white accents)
{ ground:"#1a1630", speck:"rgba(200,190,255,0.05)", glow:"140,120,255", wall:"#070512", wallTop:"#140f28",
  sky:["#05030f","#0c0820"], back:"void", accent:"#b9a8ff" },
```
`worldTheme()` returns `WORLD_THEME[s] || WORLD_THEME[0]` → index 5 auto-picked once W6 is a real (non-comingSoon) series. Menus/HUD/chevrons read `L.hue` from the SERIES row (`#7b6cff`), not from here.

### 2.Y — drawBackdrop "void" branch (insert before the final `} else {` fallback)
```js
} else if(B==="void"){
  for(let n=0;n<2;n++){                                       // two slow nebula clouds
    const nx = (n? W*0.70 : W*0.26) - px*(0.018+n*0.014), ny = n? H*0.66 : H*0.28;
    const rad = ctx.createRadialGradient(nx,ny,0, nx,ny, H*(0.55+n*0.2));
    rad.addColorStop(0, n? "rgba(96,120,255,0.10)" : "rgba(150,80,235,0.11)"); rad.addColorStop(1, "rgba(20,10,40,0)");
    ctx.globalAlpha=1; ctx.fillStyle=rad; ctx.fillRect(0,0,W,H);
  }
  const ppx=((W*0.8 - px*0.01)%(W+300)+W+300)%(W+300)-150, ppy=H*0.20;   // one distant planet
  const pg=ctx.createRadialGradient(ppx-6, ppy-6, 2, ppx, ppy, 26);
  pg.addColorStop(0,"#8f7cff"); pg.addColorStop(1,"#241a4a");
  ctx.globalAlpha=0.5; ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(ppx, ppy, 26, 0, TAU); ctx.fill();
  const LN=[70,42,22], LP=[0.02,0.05,0.10], LZ=[0.6,1.0,1.7];   // 3 star layers far→near
  for(let L2=0; L2<3; L2++) for(let i=0;i<LN[L2];i++){
    const seed=i*97.13+L2*311.7, xx=((seed - px*LP[L2])%W+W)%W, yy=(seed*1.73)%H;
    const tw=0.3+0.7*Math.abs(Math.sin(t*(0.5+L2*0.45)+i*1.3));
    ctx.globalAlpha=tw*(0.45+L2*0.2);
    ctx.fillStyle=(i%9===0)? T.accent : (i%3? "#eef2ff" : "#c9d6ff");
    ctx.beginPath(); ctx.arc(xx,yy, LZ[L2], 0, TAU); ctx.fill();
  }
  const ss=(t*(1/7))%1;                                        // ✨ shooting star ~every 7s
  if(ss<0.07){ const p=ss/0.07, hx=W*0.12+p*W*0.72, hy=H*0.16+p*H*0.30;
    ctx.globalAlpha=Math.sin(p*Math.PI)*0.85; ctx.strokeStyle="#e6ecff"; ctx.lineWidth=2; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx-30,hy-11); ctx.stroke();
  }
}
```
`T`, `t`, `px=game.cam.x`, `W`, `H`, `TAU` all in scope. Cost ~140 arcs + a few radial fills/frame — on par with snow(80)/factory(44). The shared `ctx.globalAlpha=1;` after the fallback cleans up. **Compositing chain (verified):** `drawBackdrop` runs FIRST (screen-space) → camera transform → opaque `groundCv` blit → transparent void pixels reveal the parallaxing starfield → a chasm reads as real depth.

---

## 3. WORLD DATA

### 3.1 — SERIES insertion (between the SPLASH ZONE row and the `comingSoon:true` "NEW WORLD" card)
```js
{ name:"COSMIC RUSH", emoji:"🌌", hue:"#7b6cff", blurb:"Slingshot round planets, dive through wormholes, dodge drifting rocks — everything floats out here.", count:15, reward:"ufo" },
```
`start`/`count` auto-compute. First append the 15 grids to `LEVELS` (before the closing of the array). Golden Goat auto-moves to the new last index (`LEVELS.length-1`) — no code change. Beating W5 now shows "🌟 COSMIC RUSH UNLOCKED!" (via `nxt = SERIES[cs+1]`, now non-comingSoon).

### 3.2 — UFO paid → reward conversion
- **VEHICLES entry** `{ id:"ufo", name:"THE SAUCER", price:40, ... }` → change `price:40` to `price:0` and add `reward:true`. **KEEP** `ownWheels:true, noLights:true, trail`. Do NOT move the line (nothing indexes VEHICLES by position).
- **CAR_STATS.ufo** `{spd:6, acc:5, hnd:7, bst:8}` → **`{spd:7, acc:6, hnd:9, bst:9}`** (ruling M6 — A-class 775, ties top reward car, below the S-class goat). One revertable line; only affects the human campaign car.
- **No pipeline code change:** `_seriesEnd` grant (`SERIES[cs].reward`) + load-time back-grant (`SERIES[s].reward && seriesBeaten(s)`) earn it on beating W6; shop lock labels resolve via `SERIES.findIndex(s=>s.reward===id)`. Existing buyers keep it (ownership = `store.ownedCars.includes("ufo")`, never price).
- **⚠️ Sequencing (hard):** 3.2 and 3.1 must ship in the SAME change. Flipping ufo to reward while W6 is still comingSoon → `findIndex→-1` → 👑 + "🔒 BEAT LEVEL 90" label AND the grant never fires. Owners are safe either way.

### 3.3 — UFO boss render (World-6 boss levels only)
Replace the inlined rival draw block. Keep the `else` branch BYTE-FOR-BYTE the current code; add the `rv.ufo` branch:
```js
if(game.rival){
  const rv = game.rival;
  ctx.save();
  ctx.translate(rv.x, rv.y);
  if(rv.ufo){
    const bob = 1 + Math.sin(game.t*4)*0.05;
    ctx.fillStyle = "#9ad8ff"; ctx.globalAlpha = 0.28 + Math.sin(game.t*3)*0.06;
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 18, 0, 0, TAU); ctx.fill();   // tractor-beam underglow
    ctx.globalAlpha = 1;
    ctx.rotate(rv.a); ctx.scale(bob, bob);
    drawVehicleBody("ufo");
  } else {
    /* ... existing purple-rocket body, unchanged ... */
  }
  ctx.restore();
}
```
`drawVehicleBody("ufo")` is self-contained (uses only `ctx` + `game.t`). Pathing is a pure reskin — the saucer still follows `bfsPathCells` waypoints and still respects walls (does NOT fly). Optional cosmetic: HUD race-dot fill `rv.ufo ? "#9ad8ff" : "#b06ee8"` and marker `rv.ufo ? "🛸" : "👾"`.

---

## 4. THE 15-LEVEL ARC (global indices 75–89)

**Ground-solvable contract (ALL 15):** treating `@` and `V` as walls and using NO ring/hop/warp, a solid road connects S→F. Rings/wormholes/slingshots are pure optional shortcuts. Low-G is world-wide on every level. Pars monotonic 30→72s. Asteroids = `L.asteroids[]` (soft). Wormholes = `0` pairs.

**TEACH (75–81, one toy at a time):**
- **75 · MOON WALK 🌙** — teach low-G float. Wide open S-curve "skating rink", ⭐ coins on the drift line, ZERO hazards. ★★ · par 30.
- **76 · STAR HOPPER 🚀** — teach void + launch ring (`U`). Wind around a small chasm; one ring hops the gap to a landing pad; solid road curls around for anyone who misses. First transparent-void reveal. ★★ · par 32.
- **77 · FIRST ORBIT 🪐** — teach ONE gravity well (`@`). Single planet in a hairpin: hug it to slingshot or take the wide safe arc; solid core = soft bonk. ★★ · par 34.
- **78 · DOUBLE MOON 🪐🪐** — chain two wells into a figure-8 whip; plain road threads between the two solid pillars. ★★★ · par 38.
- **79 · SPACE JUNK ☄️** — teach asteroids. Two WIDE lanes, 2–3 rocks on offset periods (`phase` 0/0.33/0.66), clear timing gaps, never a sealed choke. ★★★ · par 40.
- **80 · THE WORMHOLE 🌀** — teach the warp (`0` pair). Black-hole mouth → white-hole exit by the finish; a solid road also snakes the long way. ★★ · par 42.
- **81 · CANYON LEAP 🚀🪐** — ring-leap + a well just past the landing so a good line curves the leap into a slingshot exit; solid switchback loops around. ★★★ · par 46.

**MID BOSS:**
- **82 · COMET CHASE 🛸** — BOSS vs UFO rival, `rival.mult 2.25`. Two slingshot planets + one ring shortcut; the human out-slingshots the rival's ground line (rival isn't pulled by wells, ignores rings). Bright/readable, no dark. Keep wells + rings OFF the rival's ideal BFS ground line. ★★★ · par 50 · `rival:{mult:2.25, ufo:true}`.

**ADVANCED REMIX (83–88):**
- **83 · TWIN PLANETS 🪐** — thread two competing pulls; hold the center "calm lane" where halos overlap, or let one sling you on. ★★★★ · par 52.
- **84 · ASTEROID BELT ☄️🪐** — signature combine: an asteroid drifts a lane that ARCS past a planet (authored curved illusion — a hand-curved `L.asteroids` lane past the well cell, drawn curving; NOT wired into the well loop) while wells tug YOU; wide gaps + solid road around cores. ★★★★ · par 54.
- **85 · METEOR GATE ☄️🌀** — asteroid gauntlet with two `0` wormhole pairs to skip the worst of the barrage; solid road threads it for the cautious. ★★★★ · par 56.
- **86 · DARK SIDE 🌑** — `dark:true`, headlights-only; starfield, planet halos, ring shimmer + wormhole glow become the primary light. One strong well felt more than seen; ⭐ coins light the safe arc; simple geometry. ★★★ · par 56 · `dark:true`.
- **87 · ZERO-G ZONE 🌠** — pure-flow arena: wells as pinball bumpers, rings as launch shortcuts, NO timing pressure — momentum mastery (all non-directional). ★★★★ · par 60.
- **88 · GALAXY SPRINT 🌌** — everything remixed, pre-finale victory lap, NO boss: slingshot → asteroid belt → wormhole → ring-leap → void window in sequence; solid path threads all of it. ★★★★ · par 66.

**FINALE BOSS + Golden Goat:**
- **89 · SUPERNOVA 💥🛸** — FINALE BOSS vs UFO, `rival.mult 2.40`. Double-slingshot opening (placed to favor the kid's line = catch-up), ring-leap across the biggest star-chasm, a mid-race `0` wormhole, one asteroid dodge into a triumphant open straight + confetti. Golden Goat auto-hosts here (`LEVELS.length-1`). ★★★★★ · par 72 · `rival:{mult:2.40, ufo:true}`.

Boss races: 2 (82, 89). Dark: 1 (86). Both bosses' BFS ground route must stay clear of wells/rings/asteroid-sole-corridors.

---

## 5. INTERACTION + REGRESSION MATRIX

| Tile / feature | Maze variety | Boss rival | Golden crate | Validator | Co-op/VS/KO | Atmosphere | Stuck-hint |
|---|---|---|---|---|---|---|---|
| `@` well | Non-dir glyph → mirrors free | `@` solid → BFS routes around free; §2.S bounded nudge bends its arc | §6-avoid: block cell + ±1 pad | Normalize `@`→`#` (wall) | Empty `game.wells` → no-op | Prerender wall-skip → sprite over floor | `@` solid → hint routes around free |
| `0` black hole | Non-dir glyph → mirrors free | §2.I trapAvoid → routes around; no pull/warp | Existing portal-add + ±1 pad | Pair-count 0/2 + no-mix-`T` | Empty `game.portals` → no-op | `drawBlackHole` split | Passable → hint may cross; fine |
| `V` void | Non-dir glyph → mirrors free | §2.O void mask in bfsPathCells → routes around; `path.length<=1` fallback | §2.O flow=-1 fails ok() + racing line routes around | `noVoid` independent check (wall for reach) | Empty mask → no-op | Transparent punch + rail | §2.O void in flow field → never points into chasm |
| `U` ring | Non-dir (flies along heading) → mirrors free | Rival ignores rings (takes ground detour) — intended | §6-avoid: block ring cell | `openPass` handles (U≠#) | Empty `game.rings` → no-op | `drawRing` + trajectory arc | Passable → fine |
| ☄️ asteroid | **§2.J explicit reflect** (dx/dy data) | §2.S `rivalBlocked` cell → boss waits; guard: never seal sole corridor | §6-avoid: whole swept lane | Runtime prop → invisible to grid validator, zero change | `L.asteroids||[]` → no-op | Additive draw, violet palette | Not solid → untouched (soft-rock point) |
| Low-G scalar | World-keyed not tile → variety-agnostic | `game.rival` not in `game.cars` → untouched | No geometry change | No change | `lowG=false` (levelIx=-1) → no-op | — | No BFS change |
| UFO reward | Load-time flag, no coord data → no-op | Reskin only, same pathing | — | No change (data-driven off VEHICLES/SERIES) | Stat-neutral in VS/KO/co-op | — | — |

---

## 6. VALIDATOR CHANGES (tools/validate-levels.js)

1. **`@` = WALL** — normalize at the very top of `checkCampaign`, before `frame()`/`bfs`, so every predicate + `frame()` treats `@` as the wall it is (chain-bug-proof, no new predicate):
   ```js
   const rows = L.grid.map(row=>row.replace(/@/g,'#')), iss=[]; frame(rows,iss);
   ```
2. **`V` = WALL for ground reachability** — add after `noFoam`:
   ```js
   const noVoid = ch => ch!=="#" && ch!=="V";   // 🕳️ void = hole: WALL for ground reachability (no launch-only)
   ```
   In `checkCampaign`, restructure so `noVoid` is an INDEPENDENT check inside an `else` — **NOT** chained onto the foam `else if` (that's a real bug: `openPass` counts `V` passable → base check passes → a void-only-bridge/foam-clean level short-circuits before `noVoid` runs):
   ```js
   if(bfs(rows,[S],openPass)[F[1]][F[0]]<0) iss.push("CAN'T REACH THE FLAG");
   else {
     if(bfs(rows,[S],noFoam)[F[1]][F[0]]<0) iss.push("a foam float (%) is the only S→F bridge — add an alternate ground route");
     if(bfs(rows,[S],noVoid)[F[1]][F[0]]<0) iss.push("the void (V) is the only S→F crossing — add a solid ground detour (no launch-only)");
   }
   ```
3. **`0` black hole = passable + pair rule** — in `frame()` (mirror the `T` 0-or-2 rule; use the file's actual portal-count helper):
   ```js
   const nBH = findAll(rows,"0").length;
   if(nBH!==0 && nBH!==2) issues.push(`black holes=${nBH} (must be 0 or 2)`);
   if(nBH && findAll(rows,"T").length) issues.push("don't mix T portals and 0 black holes — they share the portal pair");
   ```
4. **`U` ring = passable** — `openPass` (U≠#) handles it; no predicate needed.
5. **Coin advisory (non-blocking):** also compute `const dv=bfs(rows,[S],noVoid);` and for each coin where `dv<0 && d>=0` push `⚠ coin only reachable by launch — fine as a ring-route bonus`.
6. **Doc comment (catalog):** classify `@`=WALL (route around; pull is runtime), `0`=passable black-hole wormhole (pairs like T; pull runtime), `V`=void-wall (campaign-only), `U`=passable launch pad.
7. Mode auto-detect (`pick`, keys off `!`/`Q`/`2`) → all four route to `checkCampaign`; other modes never contain them.

---

## 7. BUILDER SUPPORT — deliberately EXCLUDE all W6 tiles

Keep `@ 0 V U` OUT of all three coupled spots: `TOOL_LIST`, `TOOL_ICON`, and the `decodeTrack` whitelist regex (`/^[#.SFcnkDG*h~<>^vOJ&%]+$/`). Rationale: the builder's own `validateRows` only checks `ch!=="#"` reachability — it does NOT enforce the void-as-wall / no-launch / ground-route-around-solid-core rules, so exposing these would let players save ground-unsolvable tracks. W6 tiles are campaign-only, validator-guarded. Excluding them from the regex also rejects any shared `#T=` link containing them. Asteroids are a runtime prop → no builder surface at all. Other modes parse any stray glyph as non-solid road → no crash.

---

## 8. TEST PLAN (in-browser via `__tm.step`)

Load a scratch W6 level per case (or the real arc). Drive with `__tm.step` and assert on `game.car` / `game.rival` state.

1. **Gravity pull/slingshot** — spawn near an `@`, coast (no input) toward it: assert `game.car.vx/vy` bends toward `w.x/w.y` each step; full-throttle away from core: assert speed climbs (escapable). Graze at speed → heading curls around the corner.
2. **Well core = soft bounce** — drive straight into `@`: assert car never enters the cell, velocity reflects (~1.35 coeff), no respawn, no death.
3. **Black-hole warp** — approach a `0` within `BH_R`: assert suction ramps up; cross `BH_CAP`: assert `car.x/y` jumps to the paired portal, `portalCool≈1.1`, "WARP!" float; verify no ping-pong (car doesn't immediately re-warp).
4. **Ring over black hole** — launch (airT>0) directly over a `0`: assert NO capture (grounded-only), lands past it.
5. **Void respawn** — drive a grounded car onto a `V` cell: assert teleport to `car.spawn`, `vx=vy=0`, `invuln=1.4`, beam-back beep (not bonk). Armed 🛡️: assert `blockHit` absorbs (no respawn).
6. **Launch-ring airborne** — enter a `U` at cruise: assert `airT≈0.82`, velocity along `heading`, flight ≈3.1–3.5 cells, sails over a `V` gap, normal splashdown on solid.
7. **Asteroid bump** — collide a grounded car with a rock: assert `invuln` set, ejection (keeps 40% forward + outward pop, never dead-stop), rock recoils; ring hop over a rock → no collision (`airT>0` skip).
8. **Low-G feel** — on a W6 level assert `game.lowG===true`; release throttle mid-drift: coast decays slower than a W5 level (compare `exp(-1.1·dt)` vs `-2.2·dt`); grip settle ≤0.3s; `maxSp` unchanged vs W5. On a non-W6 level assert `game.lowG===false` and identical physics.
9. **UFO reward grant** — set stars to 1★ across all 15 W6 indices, trigger `levelClear` on index 89 (or reload): assert `store.ownedCars.includes("ufo")`, "🎁 THE SAUCER UNLOCKED!". Prior paid-owner save: assert ufo still equippable, now stats {7,6,9,9}.
10. **UFO boss render** — on level 82/89 assert `game.rival.ufo===true`; on a W1–W5 boss assert `game.rival.ufo===false` (unchanged purple rocket). Visual: saucer bob + tractor-beam underglow.
11. **Atmosphere / void backdrop** — on a W6 level assert `worldTheme().back==="void"`; screenshot: starfield parallaxes through `V` cells as the camera pans; warning rail visible on chasm edges; planet renders as sprite (no brick pillar).
12. **Rival reaches F** — on every W6 boss level, run to completion: assert `game.rival.done` becomes true (routes around `@`/`0`/`V`, waits out asteroids). Confirm `path.length>1` (not the fallback) on 82 and 89.
13. **Validator 90/90** — run `node tools/validate-levels.js`: assert all 90 campaign levels pass; deliberately author a void-only-bridge scratch level → assert it FAILS with the void message; a lone `0` → assert "must be 0 or 2"; `T`+`0` mix → assert the no-mix error.
14. **No regressions** — load one level from each of W1–W5 + VS + KO + co-op + a custom track: assert no console error, `game.wells/voids/rings/asteroids` all empty arrays, physics/pathing/golden-crate/backdrop identical to pre-change (spot-check `game.lowG===false`, `worldTheme().back!=="void"`).
15. **Maze variety** — force a variety flip on a W6 level with an asteroid: assert the rock's origin + dx/dy mirror correctly (drifts the reflected direction), and `@`/`0`/`V`/`U` land in mirrored cells.

---

## 9. COMPLETENESS CRITIQUE (ambiguities / risks → resolutions)

1. **Well-pull vs low-G-accel escapability (the one hard numeric tie).** With the final low-G accel factor 0.85, cruise thrust = 750×SPD(0.85)×0.85 ≈ **542 px/s²**. The well is quadratic (`f²`) with a SOLID core, so the max pull a car experiences before bumping the core is at f≈0.9–0.95 → 560×0.85×0.81–0.90 ≈ **385–430 px/s²** < 542. **Escapable — they compose.** The feel spec's conservative "≤420 pin" assumed linear-at-rim; quadratic + solid core makes it moot. **Resolution:** ship as spec'd; single tuning knob if the combined feel is too slippery near a planet = lower `WELL_PULL` first (never touch grip). Playtest wells+low-G TOGETHER (levels 83, 87, 89).
2. **Wells pull airborne cars (no `airT` gate) → infinite low orbit at the rim?** The `1−d/WELL_R` quadratic falloff + gentle 560 peak + `airT` decay (0.55–0.82s) bound the arc; airborne skips `collideWalls` so the core can't wedge. **Resolution:** playtest level 87 (wells-as-bumpers) + 89; if an orbit reads badly, gate the airborne pull to `f>0.3`. Low risk.
3. **Rival nudge wobble near a planet** (perpendicular gravity vs waypoint corrective pull). Bounded ≤60% of a forward step + `isSolid`-guarded → cosmetic only, never a stall/clip. **Resolution:** if it reads badly, drop to 40% or gate to `f>0.3`.
4. **Black-hole horizon near S/F** — the inner horizon is intentionally inescapable-without-nitro; adjacent to S or F it could warp a kid away from the flag repeatedly. Validator does NOT catch this. **Resolution:** AUTHORING GUIDELINE (document in AUTHORING.md) — never place a `0` horizon adjacent to S or F.
5. **`0`-vs-`O` legibility** in raw grids. They never co-occur (`O` is W4-only); parser/validator treat them distinct. **Resolution:** the `0` pair-count check flags an accidental lone `0`; documented caution.
6. **Asteroid transform reflect (§2.J) is the ONE non-free variety cost.** Omitting it silently desyncs rocks from every flipped W6 maze. **Resolution:** confirm the `mapC`/`mapR`/`h`/`v` helper names at the crusher reflect line BEFORE pasting; test #15 covers it.
7. **Boss sole-corridor asteroid** could seal the only path. **Resolution:** authoring guard — one rock or phase-staggered multiples on any sole boss corridor; a ping-pong lane always vacates each cycle so `rivalBlocked`-wait guarantees finish.
8. **Void transparency depends on layer order** (`drawBackdrop` screen-space FIRST → opaque `groundCv` blit → cleared void pixels reveal starfield). Verified in current `drawWorld`. **Risk:** a future opaque full-screen pass inserted between backdrop and blit would occlude it. **Resolution:** noted; the single-insertion `clearRect` at the END of prerender is the lowest-touch approach (no scattered guards to miss).
9. **Launch distance vs speed upgrades** — a maxed car (higher `mSpd/kSpd`) flies slightly farther than a fresh one. **Resolution:** author landing island ≥2 cells deep to absorb overshoot; gap ≤2 cells; the ground-solvable contract prevents any true soft-lock (you can always drive the long way).
10. **`game.road` exclusion of `V` (the one shared-line edit).** Guarded by `ch!=="V"` → no-op for every non-W6 level. Regression glance: `scatterCoins` + golden fallback both already filter road, so fine (test #14).
11. **Sequencing (highest ship-risk):** the UFO reward flip (3.2) and the SERIES row (3.1) MUST land atomically, or new players can never earn the ufo and the shop label breaks. Owners are safe either way. **Resolution:** single change, enforced at integration.
12. **Docs (per MEMORY.md documentation-priority):** update `tools/AUTHORING.md` — tile list (add `@ 0 V U` + the VOID-as-wall rule + the `0`-pair rule + the black-hole-near-S/F and ring-gap-≤2 authoring guidelines) and the "Add a world" section (note W6). Not optional.

**Verdict:** the spec is complete and internally consistent. Every mechanic reuses an existing seam; every non-W6 world/mode is a proven no-op (empty arrays / `lowG=false` / `back!=="void"`). The only genuinely new coupling is the gravity force block (2 loops) and the asteroid soft-collision — both bounded and playtest-flagged. Ship order: §2 (engine, top-to-bottom) → §3 (data, atomic) → §6/§7 (validator/builder) → author §4 → run §8.
