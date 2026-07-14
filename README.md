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
- **30 levels across 2 worlds** with ice to drift on 🧊, portals 🌀, smashable
  crates 💥, goober gangs, headlights-only night levels 🌙, gate mazes 🚧 and
  BOSS RACES against the goober's purple car — lose and it's an instant rematch.
  Beat the very last level to unlock the secret 🐐 GOLDEN GOAT.

## 🌍 Worlds
The campaign is grouped into **worlds**: **TURBO BASICS** (the first 15) then
**BRAIN FREEZE** (15 tougher ones — ice, portals, gate mazes, goober swarms and
meaner bosses). The title screen opens a **PICK YOUR WORLD** hub: tap a world to
see its level map, or 🗺️ to come back. Beat every level in a world (1 ⭐ each)
and the next world unlocks — each one a little brainier than the last.

**Adding a world** (for grown-ups): drop 15 more levels into `LEVELS` in
`index.html`, then add a `{ name, emoji, hue, blurb, count:15 }` entry to the
`SERIES` array right before the `comingSoon` card. Starts auto-compute and saved
progress carries over — nothing gets renumbered.

## ⚔️ VS mode (two players, one screen)
Tap **⚔️ VS** on the map. The whole maze fits on screen — P1 steers with the
left thumb (or ARROWS), P2 with the right thumb (or WASD). 3-2-1-GO, first
to the flag wins, coins and aura crown their own champs, and the series
score is remembered. You can also race any track you built.
Set the names in the 🔧 TWEAK ZONE (`playerName`, `player2Name`).

Feels too fast or the boss too hard? Open `index.html` and tweak
`speed` and `bossSpeed` in the 🔧 TWEAK ZONE.

## 🤝 Co-op mode (two players, one team)
Tap **🤝 CO-OP** on the hub. Same shared screen and controls as VS, but now
you **win together** — *both* cars have to reach the flag. The twist is the
teamwork gate: one player parks on a glowing **pressure plate** to open the
linked **door** so the other can drive through, then they swap so the first
one can cross too. **15 levels** that ramp up — ice, double-airlocks, coin
vaults and mazier rooms. Beat one to unlock the next.

## Build your own tracks (v2)
Tap **🔨 BUILD** on the map. Finger-paint walls and roads, drop coins, keys,
doors, gates, boost pads and goobers. **TEST ▶** races it instantly; the game
checks your maze is beatable first ("CAN'T REACH THE FLAG!"). Save up to 10
tracks in the garage — they show up on the map next to the campaign.

**📤 Share** turns a track into a link (the whole maze lives inside the URL —
no server). Text it to someone; opening it drops the track straight into
their garage: *NEW TRACK ARRIVED! 📦*

## Make it yours
Open `index.html` and find the **🔧 TWEAK ZONE** at the top of the script:
car color, game title, driver name, the words the game yells.
The campaign levels are drawn in ASCII right below it — same alphabet the
builder uses: `#` wall · `.` road · `~` ice · `S` start · `F` finish · `c` coin ·
`n` nitro · `k` key · `D` door · `G` timed gate · `*` boost pad · `h` goober

## The garage shop (v3)
Tap **🛒 SHOP** on the map. Coins you collect in any level bank up and buy:
- **8 rides:** Red Rocket, Turbo Taxi, Banana, Big Green (a tractor), Glizzy GT,
  Cart Racer, Skibidi GT (yes, a racing toilet) and The Saucer
- **4 pets** that chase your car through the maze: Ducky, Buddy, Boo, Rexy
- **Car number** — every ride wears a roof decal, changeable 0–99 (default: 67, obviously)

First shop visit comes with a grand-opening gift so there's something to buy on day one.
