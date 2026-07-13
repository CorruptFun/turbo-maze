# Maze Adventure — game build brief

A build-ready brief for a **new session**. It's self-contained: a fresh Claude can start from
this alone. (Separate project from Applebee Acres — kept out of the farm's git on purpose.)

## What it is
A **level-based maze + obby (obstacle-course) adventure** for kids, built as a self-contained
web game and shipped to a link that opens on a tablet. Two-player friendly (couch co-op / take
turns) so a parent and child play together. The killer feature is a **level builder** so they
design levels for each other.

## Who it's for
Austin's son, **age 7**. Plays it *with* his dad. What he's into (design straight to this):
- **Maze games he progresses through levels on** — the thing his dad sees him play most. HIGHEST-confidence signal.
- **Obbies** (obstacle courses) — navigate/time hazards.
- **Building.**
- **Collecting / unlocking / simulators** ("numbers go up," a growing roster) — plays *Steal a Brainrot* and similar. Reproduce the DRIVERS (collect funny characters, numbers go up, gentle mischief/competition), not the meme IP.
- **Exploring worlds** (his Roblox love) — variety of themed areas.

The unifying shape across all of it: **get through levels, navigate a space, unlock the next thing.**

## Core concept
- A little character you steer through **top-down maze levels**, each also a **mini-obby**: keys to grab, doors to open, moving walls, timed gaps, coins in dead-ends, a hazard or two.
- Clear a level → a **world map** opens the next (the Mario/level-select progression he responds to). The map spans several **worlds to explore** so it never looks the same.
- **Collect & unlock** (the simulator itch, wholesome): coins unlock a roster of goofy characters + a **pet that follows you** through the maze. Roster grows; keep chasing the next unlock.
- **Level Builder (the father-son magic):** he builds a maze, dad races it; dad builds a tricky one, he beats it. Building + obby + play-together in one feature, infinite replay.

## Why web, not Roblox
Roblox lives half in Luau *and* half in the Studio visual editor — no AI can drive that editor, which is why Gemini 3.1 struggled. A self-contained web game: I build it end-to-end, **ship to a link that opens on the tablet in seconds** (no Studio, no account, no install), touch + keyboard, saves progress. If Roblox specifically ever matters, the mechanics prototyped here can inform a Luau obby later.

## Tech approach (proven — it's how Applebee Acres is built)
- Single self-contained `.html`: inline CSS + canvas + vanilla JS. No build step, no deps.
- **Touch controls** (swipe or on-screen d-pad) AND keyboard; detect and support both — it's a tablet game first.
- `localStorage` for progress/unlocks/saved custom levels.
- Ship via the same pipeline as the farm: **Artifact** (private link, instant on tablet) and/or **GitHub Pages**. Consider a NEW repo when it gets real — don't fold it into applebee-acres.
- Keep draw code hash/time-driven and leak-safe (same discipline as the farm).

## Design rules for a 7-year-old
Forgiving (generous hitboxes, quick respawn at the last checkpoint, never a hard game-over) ·
celebratory (coin pops, a win jingle, confetti/stars on level clear) · readable at a glance ·
**no reading required** (icons, arrows) · big friendly character with squash/stretch + a motion
trail (modern juice) · save automatically · short levels (30–90s).

## Roadmap
- **v1 (one sitting, playable immediately):** movement + 4–5 handcrafted maze/obby levels + coins + keys/doors + one hazard + world map + level-complete celebration + touch controls + save. Ship the link.
- **v2:** the **level builder** (place walls/coins/keys/hazards/start+goal, save, share/replay).
- **v3:** the **unlock shop** — characters + the follower pet, coin economy.

## OPEN DECISION (not yet answered — ask Austin first thing)
**Theme:** worlds that **riff on Applebee Acres** (farmyard, spooky barn, Boone as the follower
pet — a sweet tie to the farm he already built) **vs. fresh worlds** (space / jungle / candy — a
clean new thing that's just his). Also: let his son **name it** if he wants.

## Juice / modern-feel checklist
Squash-stretch + trail on the character · coin/gem pop + sound · screen shake on hazard hit ·
level-complete confetti + star rating (1–3 stars by coins/time) · a hub world map you can roam ·
sound throughout (WebAudio, no assets needed — synth blips) · smooth camera follow.
