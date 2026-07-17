# TURBO MAZE 🏁

A drift-racing maze game built by a dad and his 7-year-old co-designer.
One HTML file, no dependencies. Runs on a tablet or with a keyboard.

**▶ Play it:** https://corruptfun.github.io/turbo-maze/

## How to play
- **Tablet:** left thumb anywhere = joystick · right button = ⚡ NITRO
- **Keyboard:** arrows / WASD drive · SPACE = nitro · P = pause · M = mute
- Drift around corners for aura. Grab every coin. Find the key 🗝️ to open doors.
- Watch out for the goober 👾 — he yoinks your coins (steal 'em back).
  Or hit him at **nitro speed** for the 💥 TAKEDOWN: +25 aura and he drops his loot.
- Finish fast + all coins = ⭐⭐⭐
- Worlds grow **bigger and brainier** the deeper you go — endgame mazes are giants.
  Long mazes plant a 🚩 **checkpoint** at the halfway mark: fall in a trap late and
  you respawn there, never back at the start.
- **90 levels across 6 worlds** with ice to drift on 🧊, portals 🌀, smashable
  crates 💥, goober gangs, headlights-only night levels 🌙, gate mazes 🚧,
  shifting walls that rearrange the maze mid-run, a whole **factory floor**
  of conveyor belts, sliding crushers and trap doors, and a **water park** 🌊
  with splash pads that fling you airborne, sticky shallows and sinking foam
  floats — plus BOSS RACES against
  the goober's purple car (lose and it's an instant rematch).
  Beat the very last level to unlock the secret 🐐 GOLDEN GOAT.

## 🌍 Worlds
The campaign is grouped into **worlds**: **TURBO BASICS** (learn to drift),
**BRAIN FREEZE** (ice, portals, gate mazes, goober swarms, meaner bosses),
**MAZE MAYHEM** (shifting walls that rearrange the maze while you drive),
**METAL MELTDOWN** (the factory floor 🏭 — conveyor belts that shove you around,
sliding crushers to time your dash past, and trap doors to weave around),
**SPLASH ZONE** (the water park 🌊 — 🟠 splash pads that fling you *over* walls
and gaps, 🟣 sticky shallows that slow you to a wade (hit nitro to power through),
and 🧱 foam floats that sink a beat after you touch them, all riding on water
currents and waterslides — see [docs/SPLASH-ZONE.md](docs/SPLASH-ZONE.md)) and
**COSMIC RUSH** (deep space 🌌 — everything gently floats! 🪐 slingshot around
planets whose gravity bends your racing line, 🕳️ dive into black holes and warp
out the white hole, 🚀 blast through launch rings over chasms of real starfield,
and dodge drifting asteroids ☄️. The boss flies a UFO — **beat the world and the
saucer is yours** 🛸 — see [docs/WORLD6-BUILD-SPEC.md](docs/WORLD6-BUILD-SPEC.md)). The
title screen opens a **PICK YOUR
WORLD** hub: tap a world to see its level map, or 🗺️ to come back. Beat every
level in a world (1 ⭐ each) and the next world unlocks — each one a little
brainier than the last.

**Adding a world** (for grown-ups): drop 15 more levels into `LEVELS` in
`index.html`, then add a `{ name, emoji, hue, blurb, count:15 }` entry to the
`SERIES` array right before the `comingSoon` card. Starts auto-compute and saved
progress carries over — nothing gets renumbered.

**🔒 Locked levels:** on any level with a key + door, the finish is automatically
**sealed behind a door at load** (`gateFinish` in `index.html`) so there's no way
around the lock — you must find the key first. It's verified per level (key
reachable before the door, finish reachable only with the door open), skips
levels it can't seal safely, and auto-covers any future key/door level, so you
can author them loosely. (A finish-needs-key check is the backstop.)

**🔀 Maze variety:** from **World 2 on** (and co-op **Season 2** on), each maze is
mirrored or rotated at load so the start & finish land in different corners
instead of always top-left → bottom-right. It's **deterministic per level** (a
level always looks the same on replay), World 1 / co-op Season 1 stay the classic
diagonal as the gentle intro, and it's a true mirror/rotate so path length — and
therefore par times and star balance — is unchanged (conveyor arrows, crushers,
and hazard paths all flip correctly too). Turn it off with `mazeVariety:false` in
the 🔧 TWEAK ZONE.

## ⚔️ VS mode (two players, one screen)
Tap **⚔️ VS** on the hub. The whole maze fits on screen — P1 steers with the
left thumb (or ARROWS), P2 with the right thumb (or WASD). 3-2-1-GO, first
to the flag wins, coins and aura crown their own champs, and the series
score is remembered. You can also race any track you built.
Set the names in the 🔧 TWEAK ZONE (`playerName`, `player2Name`).

**⚔️ Battle mechanics** (in the newer arenas): **💥 bumper cars** — ram your
rival at speed to spin them out and swipe one of their coins; **⚡ zap
pickups** — grab one and your rival instantly spins out (it auto-targets, so
no extra button); **🧱 trap triggers** — drive over a red button to slam a set
of walls shut across the map for a few seconds (spring it when your rival's
about to pass!). Ten arenas now, from open **Bumper Bowl** to the
everything-at-once **Overdrive** — plus two **factory** arenas (**Conveyor
Clash, Factory Fury**) where belts shove you off your line, a crusher grinds
through the ring and trap doors open under your wheels.

**💥 Knockout mode** — flip the **RACE / KNOCKOUT** toggle on the VS screen for
last-one-standing. No finish line: you get **3 lives** and win by shoving your
rival (ram them, or ⚡zap-then-ram) into a **🕳️ hazard pit**. Six arenas of
molten pits — **The Pit, Danger Zone, Hot Cross,** the pit-maze **Grinder**, and
two factory pits (**Conveyor Pits, Scrap Press**) where the belts do the shoving
for you and a crusher works the middle.

Feels too fast or the boss too hard? Open `index.html` and tweak
`speed` and `bossSpeed` in the 🔧 TWEAK ZONE.

## 🤝 Co-op mode (two players, one team)
Tap **🤝 CO-OP** on the hub. Same shared screen and controls as VS, but now
you **win together** — *both* cars have to reach the flag.

**Season 1** — the teamwork gate: one player parks on a glowing **pressure
plate** to open the linked **door** so the other can drive through, then they
swap so the first one can cross too. 15 levels — ice, double-airlocks, coin
vaults and mazier rooms.

**Season 2** — **button sequences**. Numbered **pads** (1, 2, 3…) must be
pressed **in order** to open the gate to the flag — but hit one out of order
and **both cars snap back to the start!** Split the pads between you, call out
the order, and don't fumble it. 15 tougher levels with ice and mazes.
Beat a level to unlock the next; the co-op map now runs 30 deep.

## Build your own tracks (v2)
Tap **🔨 BUILD** on the map. Finger-paint walls and roads, drop coins, keys,
doors, gates, boost pads, goobers, **conveyor belts** (⬅️➡️⬆️⬇️ — they shove the
car the way they point) and **trap doors** (🕳️ — drive on one and you drop
through and respawn). **TEST ▶** races it instantly; the game checks your maze is
beatable first ("CAN'T REACH THE FLAG!"). Save up to 10 tracks in the garage —
they show up on the map next to the campaign.

**📤 Share** turns a track into a link (the whole maze lives inside the URL —
no server). Text it to someone; opening it drops the track straight into
their garage: *NEW TRACK ARRIVED! 📦*

## Make it yours
Open `index.html` and find the **🔧 TWEAK ZONE** at the top of the script:
car color, game title, driver name, the words the game yells.
The campaign levels are drawn in ASCII right below it — same alphabet the
builder uses: `#` wall · `.` road · `~` ice · `S` start · `F` finish · `c` coin ·
`n` nitro · `k` key · `D` door · `G` timed gate · `*` boost pad · `h` goober ·
`T` portal · `x` crate · `M`/`N` shifting walls · `<` `>` `^` `v` conveyor belts ·
`O` trap door. (Sliding crushers are a per-level `crushers:[...]` property.)

## The garage showroom (v4)
Tap **🛒 SHOP** on the map for a **Forza-style showroom**: your car stands on a
lit turntable, **swipe** the big carousel (or tap / use the ◀ ▶ arrows) to browse
every ride, and a translucent **spec card** shows its **Performance Index**
(100–1000), a **class** (D·C·B·A·S), and four bars — **SPEED · ACCEL · GRIP ·
BOOST**. Coins you collect in any level bank up and buy:
- **10 buyable rides:** Red Rocket, Turbo Taxi, Banana, Big Green (a tractor),
  Glizzy GT, Cart Racer, Skibidi GT (yes, a racing toilet), The Saucer, 2FAST and
  The Beast
- **4 pets** that chase your car through the maze: Ducky, Buddy, Boo, Rexy
- **Car number** — every ride wears a roof decal, changeable 0–99 (default: 67, obviously)

**The stats are real.** Each car has its own SPEED / ACCEL / GRIP / BOOST, and in
the campaign your equipped car actually drives to them — a nippy cart darts, a
tractor corners like it's on rails, the Golden Goat does everything. Differences
are gentle (~±10%) and apply to **your campaign car only**, so VS / Knockout /
Co-op stay perfectly fair. Full spec & tuning: [`docs/GARAGE-SHOWROOM.md`](docs/GARAGE-SHOWROOM.md).

First shop visit comes with a grand-opening gift so there's something to buy on day one.

**🎁 Free reward rides — one per world:** beat every level in a world and its
themed car lands in your garage for free — **BLAZE** (🏁 Turbo Basics, a flame hot
rod), **FROST GT** (🧊 Brain Freeze, an icy racer), **GLITCH GT** (🌀 Maze Mayhem,
neon purple), and **CRUSHER** (🏭 Metal Meltdown, a monster truck). Beat the very
last level too and the secret 🐐 GOLDEN GOAT is still yours. They show as locked
(🔒 BEAT [WORLD]) in the shop until earned. Grown-ups: each world declares its
reward via `reward:"id"` on its `SERIES` entry, so a new world just adds a car +
that one field.

## 🎁 Mystery Crates (v1)
Tap **🎁 CRATES** on the hub. Spend coins on a crate and it rolls a **rarity**
(Common → Rare → Epic → Legendary → **Secret**), then a reward:
- **🎁 Mystery Crate — 100 coins** · **🎉 Mega Mystery Box — 200 coins** (never
  gives junk, 5× the Secret odds).
- **Upgrades** (permanent, tiny bumps, kept best-of-each): 🔧 engine speed,
  🛞 grip, ⚡ nitro tank, 🧲 coin magnet, 💰 lucky (more coins).
- **Power-ups** (one-use — **arm ONE** before a race, it fires by itself):
  🚀 rocket start, ✌️ double coins, 🛡️ shield, ❄️ freeze the goobers,
  👻 ghost through walls, ⏱️ slow-mo.
- **Looks** (pure flair): 🔥/🌈 trails, ✨ gold shine, 🐐/👑 toppers.
- **🎁 Golden crates (v2)** — a rare glowing crate can appear right inside a
  campaign level; drive over it mid-race for a **free** pull (no coins spent).

Upgrades and power-ups only help the **single-player campaign** — VS/Knockout
stay fair. Grown-ups, in the 🔧 TWEAK ZONE: `powerUpsInVs` allows gear in battles,
`goldenCrateChance` sets how often free crates appear (`0` = off), and
`cratesEnabled` / `cratesUpgrades` / `cratesPowerups` / `cratesCosmetics` turn the
whole system (or any one bucket) off cleanly — see
[`docs/MYSTERY-CRATES.md`](docs/MYSTERY-CRATES.md) for the full loot tables,
tuning knobs, **how to revert anything**, and **how to edit/add/remove assets**.
