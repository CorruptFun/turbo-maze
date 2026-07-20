# ☁️ Cloud Sync — design + deploy runbook

> **See also:** [`CLOUD_SAVE_GOOGLE_SIGNIN.md`](CLOUD_SAVE_GOOGLE_SIGNIN.md) — the newer,
> account-based **"Sign in with Google"** cloud save (Supabase). It's a second, independent mirror that
> runs **alongside** the 4-word code described here; both use the same `syncMerge`, so a player can use
> either or both and never lose progress.

Turbo Maze progress (stars, coins, unlocks, cars, pets, cosmetics, crate ledger,
custom tracks, ghost best-times) is one `localStorage["turboMaze"]` blob. Cloud
sync mirrors that blob to a tiny Cloudflare Worker + KV store, keyed by a
memorable **4-word code**, so it survives a wiped browser and follows the player
to another device.

> **Status: built + tested, NOT yet live.** The game ships **dormant** — until a
> Worker URL is wired in (one line, see step 5), `syncEnabled()` is `false` and
> every sync call is a silent no-op. The live game behaves exactly as it does
> today. Deploy whenever you're ready; nothing about this change is observable
> to players until then.

---

## The one rule that matters: most-progress-wins (never last-write-wins)

The server does a **CRDT-style join** of the incoming save with whatever the code
already holds. The result is `>=` both on every progress field, so:

**an out-of-date device can never permanently clobber newer progress.**

Two devices racing each other can't lose data — the worst case is a briefly-stale
value that heals on the next sync. This is *the* property that makes code-sync
safe to hand a 7-year-old with two tablets.

### Merge rules (authoritative: [`worker/merge.js`](../worker/merge.js))

| Rule | Fields | Behaviour |
|---|---|---|
| **MAX scalar** | `unlocked` `coinsBank` `aura` `coopUnlocked` `cratesOpened` `goldenFound` `nextTrackId` | keep the larger number |
| **OR flag** | `shopGift` | true once, true everywhere |
| **MAX per-key** | `stars` `coopStars` `upg` `powerups` `found` `seenItems` `goldTaken` `seriesCleared` | union of keys, larger value per key |
| **Union array** | `ownedCars` `ownedPets` `cosmetics` | set union (dedup) |
| **MIN-time per level** ⚠️ | `ghosts` | keep the **faster** run (lowest `t`) — the only field where *lower* wins |
| **Union by id** | `customLevels` | union by `.id` (first-seen on clash) |
| **Device-local — never synced** | `muted` `car` `pet` `cosmetic` `carNum` `curSeries` `armed` `syncCode` | stay on the device in hand; never leave, never overwrite |

**Deliberate, documented consequence:** currency and consumables (`coinsBank`,
`powerups`) merge *generously* (max). Spend on device A, then sync with a richer
device B, and you can effectively be "refunded." That's the safe direction for a
forgiving kids' game — never punish the kid — and it matches the roadmap spec
("max coins, union of owned…"). It is not a bug.

The client ([`index.html`](../index.html), search tag `SYNC_MERGE`) inlines a
byte-for-byte copy of these rules as a guard, so progress earned *during* the
network round-trip can never regress. **If you touch the merge, change both
copies.** `worker/merge.js` is the source of truth.

---

## How players experience it

- **On one device — fully automatic, zero friction.** First launch silently
  generates the player's own unique 4-word code and every save pushes to the
  cloud (debounced ~3.5s); every launch and every app-resume pulls. The player
  never has to see or type the code. Their progress is just backed up.
- **Moving to a new device / recovering a wiped browser — one-time code entry.**
  On the new device they open **☁️ Cloud Sync → Enter a Code**, type their
  4 words, and everything merges in. Automatic there from then on.
- **Finding the code again** (the code *is* the save, so it must never be lost) —
  subtle but always reachable, and only where a player who's already invested
  will look (deliberately **not** on the title screen, which first-timers see
  before they have any progress to protect):
  - the **☁️ button** on the Home dashboard → the Cloud Sync screen (tap the code to copy)
  - little "☁️ CLOUD CODE — TAP TO MANAGE" text in the **pause menu** → opens the Cloud Sync screen

There are **no accounts, no passwords, no email, no PII** — the code is the only
key. This honours the "no accounts, no ads, ever" pledge (ROADMAP item 12) that
is the pitch to parents. True zero-touch cross-device sync would require a login
(Apple/Google) and PII; that's parked as an "if it gets big" phase, not this.

---

## Files

| File | Role |
|---|---|
| [`worker/merge.js`](../worker/merge.js) | authoritative most-progress-wins join (ES module, no deps) |
| [`worker/worker.js`](../worker/worker.js) | the Cloudflare Worker: `POST /sync` = read KV → merge → write → return |
| [`worker/wrangler.toml`](../worker/wrangler.toml) | Worker + KV config (two ids to fill at deploy) |
| [`worker/test-merge.js`](../worker/test-merge.js) | 37 offline unit tests for the merge — the crux, proven without any account |
| [`worker/test-worker.js`](../worker/test-worker.js) | 14 Worker-handler tests (read-failure abort, validation, CORS) — no account needed |
| [`worker/mock-server.js`](../worker/mock-server.js) | local stand-in for the Worker (same `merge.js`) for browser end-to-end testing |
| `index.html` | client engine + UI (tags: `CLOUD SYNC`, `SYNC_MERGE`, `sync engine`, `drawSync`) |

---

## Deploy runbook

Prereqs: a Cloudflare account (free) and Node installed. The Worker + client are
already written; these steps stand it up and flip it on.

**1. Create the free Cloudflare account** — <https://dash.cloudflare.com/sign-up>.
   No paid plan needed. (This is the one step only you can do.)

**2. Log wrangler into that account**
```sh
cd "worker"
npx wrangler login          # opens a browser to authorize
```

**3. Create the KV namespace** (production + preview) and paste the printed ids
   into [`worker/wrangler.toml`](../worker/wrangler.toml):
```sh
npx wrangler kv namespace create SYNC
npx wrangler kv namespace create SYNC --preview
# paste id -> id = "…", preview_id -> preview_id = "…"
```

**4. Deploy the Worker**
```sh
npx wrangler deploy
```
Wrangler prints the live URL, e.g. `https://turbo-maze-sync.<your-subdomain>.workers.dev`.
Smoke-test it:
```sh
curl https://turbo-maze-sync.<your-subdomain>.workers.dev
# -> turbo-maze-sync ok
```

**5. Wire the URL into the game** — edit `index.html`, set the one line
   (search `SYNC_URL_BUILTIN`):
```js
const SYNC_URL_BUILTIN = "https://turbo-maze-sync.<your-subdomain>.workers.dev";
```
   Commit + push. On next load the game detects the URL and switches sync on:
   the ☁️ button, the code text, and auto-backup all appear. **Done.**

To roll back instantly: set `SYNC_URL_BUILTIN` back to `""` and redeploy — the
game returns to fully-local, no code changes needed.

### Free-tier note
Workers free = 100k requests/day; KV free = 100k reads/day but only **1,000
writes/day**. Writes are the binding limit. The Worker skips the KV write when a
sync doesn't change anything (a pull with no new progress = read only), which
keeps most syncs write-free — plenty of headroom for a family + early players.
If the game takes off, KV writes are $0.50/million after the free tier, or move
to D1 (see Future).

---

## Testing

**Offline unit tests (the crux — run these any time you touch the merge):**
```sh
cd worker && node test-merge.js      # 37 assertions: max/min/union/OR, device-local
                                     # exclusion, idempotency, commutativity, "no star
                                     # ever lost", custom-track collisions, undefined-safety
cd worker && node test-worker.js     # 14 assertions: the read-failure abort (a KV error
                                     # must NEVER be written back as an empty cloud),
                                     # stale-can't-lower, validation, CORS
```

**Browser end-to-end against the mock Worker (no account needed):**
```sh
cd worker && node mock-server.js     # in-memory KV on :8787, same merge.js
```
Serve the game (`python3 -m http.server 4173`), then in the game's dev console:
```js
localStorage.setItem("tmSyncUrl", "http://localhost:8787")   // override, points at the mock
location.reload()
```
The override (`localStorage.tmSyncUrl`) beats `SYNC_URL_BUILTIN`, so you can test
sync fully before ever deploying. `window.__tm` exposes `syncNow`, `syncMerge`,
`syncEnabled`, `sync`, `ensureSyncCode` for scripted checks.

Verified end-to-end 2026-07-17: two "devices" sharing one code merged correctly —
`coinsBank` took the max (stale device did **not** clobber), per-level stars took
the max, owned cars unioned, the faster ghost won, and device-local `car`/`muted`
did **not** cross over.

---

## Security & limits (MVP-honest)

- **Code entropy:** 4 words from a ~256-word kid-safe list ≈ 4.3 billion combos.
  Each new player auto-gets a unique code, so unrelated players never collide.
  Unguessable enough, and there's nothing valuable to steal (no PII).
- **No rate limiting** in the MVP Worker. If abuse ever shows up, add a simple
  per-IP throttle or Cloudflare Rate Limiting rule.
- **Body cap** 3 MB (ghosts are the bulk; KV allows 25 MB). Malformed code/body
  is rejected with a 400 before touching KV.
- **CORS** is `*` because the static game is served cross-origin (GitHub Pages →
  `*.workers.dev`). Fine for a public, no-PII save blob.
- **Shared codes merge.** If two people use the same code on purpose, their saves
  union together (a feature for a family; explain it, don't fight it).

### Known, accepted limitations (surfaced by the 2026-07-17 adversarial review, kept intentionally)
- **A KV *read error* aborts the sync — it never overwrites.** The Worker treats a
  read that *throws* (transient KV error, or a value that won't `JSON.parse`) as
  fatal: it returns `503` and does **not** write. This is deliberate — the
  alternative (treat error as "empty cloud") could wipe a save during the recovery
  flow. Cost: a corrupt KV value wedges that code until fixed. Correct tradeoff for
  a data-loss-prevention system (fail loud, never silently destroy). Guarded by
  `test-worker.js`.
- **KV is eventually consistent (no compare-and-swap).** A pathological race — two
  devices doing read-modify-write against different edge replicas at the same
  instant, where one then never syncs again — could drop that device's *unique*
  contribution. The monotonic merge heals this the moment either device syncs
  again, so it only bites a device that pushes once and vanishes forever *and*
  loses a simultaneous-write race. Acceptable for a mostly-single-device kids'
  game. If it ever matters, move the hot path to a **Durable Object** (strong
  consistency) — same `merge.js`, a small rewrite of the Worker's storage calls.
- **3 MB blob ceiling.** Oversized syncs are rejected (`413`); a save that somehow
  crossed it would stop syncing until trimmed. `ghosts` are the only growth vector
  and are far under this in practice (≈105 levels × a few KB). Raise `MAX_BODY` or
  prune oldest ghosts if it's ever approached.

## Future (parked)

**Dad's stated direction (2026-07-17): the code model works for now, but as the
game grows we'll likely need real accounts / something better.** Captured so it's
not lost. The good news — the code model is a clean *foundation*, not a dead end:

- **Accounts wrap codes with zero data migration.** Everything already lives as a
  blob under a key. When accounts arrive, a signed-in account simply *adopts* its
  anonymous code(s) — link the account record to the existing KV key (or copy the
  blob), and the same `mergeStore` handles combining multiple devices/codes into
  the account. No player loses progress in the transition; the code becomes a
  recovery fallback behind the login.
- **Leaderboards** → Cloudflare D1 (SQL), server-validated times. Layer on top of
  the same Worker; the sync blob already holds per-level best times (`ghosts`).
- **Real accounts** (Sign in with Apple / Google) → the zero-touch cross-device
  answer, but it introduces a login + PII, trading away the "no accounts, ever"
  pledge that is today's pitch to parents. A deliberate later decision tied to
  growth, not a default. See ROADMAP item 12.
- **QR / link to move devices** → device A shows a QR of its code, device B scans;
  removes the one-time typing without needing accounts. A cheap interim upgrade
  that pairs with ROADMAP item 7 ("send to a friend").
