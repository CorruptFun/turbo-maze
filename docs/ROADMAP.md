# 🏁 TURBO MAZE — Roadmap checklist

> The review-and-check-off list (dad + agents). Keep statuses honest: `[ ]` open ·
> `[~]` in progress · `[x]` shipped (add the commit hash). Full context for each item
> lives in the vault note + session logs; specs referenced where they exist.

## Make it better (joy per effort)

- [x] **1. 🎵 Music** (`see commit`) — adrenaline racing loops, procedural Web Audio (no assets):
  per-world flavor (each world gets its own key/waveform personality), boss-race
  tension variant, chill menu loop, respects mute. 
- [x] **2. 👻 Ghost time-trials** (`see commit`) — race a translucent replay of your own best run,
  campaign solo only; "GHOST BEATEN!" celebration; compressed saves (default-safe
  `store.ghosts`), per-level best-time chip. 
- [x] **3. 🚗 Garage = real showroom, owned-only** (`see commit`) — HOME 🚗 tile now
  opens the real shop showroom in `sh.garageMode`: owned cars only, no CARS|PETS tab,
  🚗 GARAGE title, equip-only (no price/lock). Old `drawGarage` grid + `"garage"` state
  deleted. Spec: `docs/WORLD7-HANDOFF.md` §Queued.
- [ ] **4. 🅱️ B-side worlds** — a second 15 unlocked by beating a world (co-op
  Season-2 shape). Parked until more playtime is wanted; rejected flat-30.
- [ ] **5. World 8** — pick the next theme (comingSoon card teases 🎢); follow
  `docs/WORLD-DESIGN-SYSTEM.md` (one new primitive + the size ladder).

## MVP to the wild (in order — each unblocks the next)

- [ ] **6. ☁️ Cloud sync by code** — THE prerequisite for sharing. Design done (vault
  note): ~50-line Cloudflare Worker + KV, memorable 4-word code, **merge /
  most-progress-wins** (never last-write-wins). Dad: create the CF account; agent:
  write Worker + client + deploy steps.
- [ ] **7. 📤 "Send to a friend" button** in-game (navigator.share of the play link) +
  a fresh-device first-run pass (minute one must be magical, zero explanation) +
  a low-end Android perf spin.
- [ ] **8. 🕹️ itch.io page** — zero-gatekeeping discovery; then **Poki / CrazyGames**
  submissions (where kids actually browse web games).
- [ ] **9. 🌐 Custom domain** — AFTER sync ships (localStorage is origin-keyed; sync
  first so saves survive the move). ~$10/yr Cloudflare Registrar.
- [ ] **10. 📱 PWA install prompt** — manifest exists; add the install nudge.
- [ ] **11. 🎬 Build-in-public clips** — record the dad+son sessions (family movies +
  the marketing engine); game link on every clip.
- [ ] **12. 🔒 Keep the safety stance** — no accounts, no PII, no ads, ever. It's the
  pitch to parents, not a limitation. Add a tiny parent-facing privacy note.

**North-star metric once shared:** do OTHER kids come back the next day unprompted.

## Done (this month, for morale)
- [x] Worlds 5/6/7 (water `d2235fc` · space `e8d25d6` · lava `5cd42ac`) — 105 levels/7 worlds
- [x] Atmosphere layer `ccddc2f` · vehicle art `9760900` · Crates v3 + book `de8de6d`
- [x] Maze growth to 8.8× + checkpoints `b1ae453` · co-op/VS growth + camera `cf3347a`
- [x] iOS text fix + fair VS `a8dcec3` · crusher collision `107d740` · maps fill iPad `958bd92`
- [x] HOME landing (modes-first) `f1d24a9` · nav overhaul `a41105d` · Brainrot Pals `baf816f`
