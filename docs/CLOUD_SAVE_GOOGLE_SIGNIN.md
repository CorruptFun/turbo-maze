# ☁️ Cloud Save — "Sign in with Google" (Supabase)

Optional, account-based cloud backup of a player's Turbo Maze progress, gated behind one-tap
**Sign in with Google**. Progress is backed up to the cloud and syncs across devices. This is a **second,
independent** cloud transport that lives **alongside** the existing no-account **4-word code** sync
(Cloudflare Worker + KV — see [`CLOUD-SYNC.md`](CLOUD-SYNC.md)). Both mirror the same local save through the
same merge, so a player can use either or both and never lose data.

> **#1 rule: progress is never lost.** `localStorage` stays authoritative; the cloud is a mirror.

---

## 1. What ships (and what stays dormant)

Everything is **inert until configured**. With the two constants in `index.html` left empty, every cloud
path no-ops, the game runs **byte-for-byte local-only**, and the Supabase library is never even downloaded.

| Piece | Where | Notes |
|---|---|---|
| Config constants | `index.html` → `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GAME_ID` | Owner fills URL + key. Empty = dormant. `GAME_ID = "turbo-maze"` keys this game's rows. |
| Cloud engine | `index.html` → `cloud*` functions | `cloudConfigured/Client/Pull/Push/SyncNow/SignIn/SignOut/Bootstrap` + `initCloud`. |
| Vendored library | `vendor/supabase.umd.js` | Pinned `@supabase/supabase-js@2.110.7`, self-contained UMD. **Dynamic-loaded only when configured** (a `<script>` injected on demand) — a dormant build never fetches it. |
| DB migration | `supabase/migrations/0001_game_saves.sql` | **Shared** `game_saves` table — one row per **(user, game)** + owner-only RLS + `updated_at` trigger. |
| UI | `index.html` → `openCloudModal()` | Settings → **CLOUD & BACKUP**, the Home ☁️ icon, and the pause menu. |

### Shared database across all games (one project, one sign-in)

This Supabase project is **shared by all of the owner's games**. Auth is project-level, so a player's
Google account is the **same identity everywhere** — sign in on any game, recognized on all of them, using
the **same Google OAuth client** (no per-game OAuth setup). Saves are isolated by a `game` slug in the
shared `game_saves` table (composite key `(user_id, game)` → one row per user per game), so **no game can
overwrite another's save**. Adding a future game = pick a new `GAME_ID` slug; **no new table, no new
migration, no new OAuth**. (Viva Maya, already live, keeps its own `saves` table in this project untouched;
it can be folded into `game_saves` later as a separate, careful task.)

There is **no build step** (Turbo Maze is one static `index.html`), so — unlike the Viva Maya reference —
there are no Vite chunks, no `.env`, no repo Variables, and no service worker/precache to manage. The anon
key is simply pasted into the file and committed (safe to ship — see §6).

---

## 2. How it stays safe (data-safety design)

- **Reconcile before any push.** On boot (`cloudBootstrap`) and — critically — on the **null→session**
  transition that a Google redirect-return produces (`initCloud`'s `onAuthStateChange`), the client runs
  `cloudSyncNow()`: **pull** the cloud row → **merge** with local (local passed first) → **persist** the
  winner → **push** it back. This happens *before* any local save can mirror a fresh/empty state over real
  cloud progress. **That null→session `cloudSyncNow()` is the single most important line for data safety.**
- **Furthest-progressed-wins merge.** Reuses `syncMerge` (mirrors `worker/merge.js`): a per-field join
  (max stars/coins, union of owned cars/pets/custom levels, best lap time). The result is `>=` **both**
  saves on every field, so nothing is ever dropped and an out-of-date device can't clobber newer progress.
- **Reconcile-gate.** A Supabase `upsert` does **no** server-side merge, so the debounced push is
  suppressed (`cloud.ready`) until the first pull+merge for the session completes — closing the
  fresh-device race.
- **Cloud can never break the local save.** `saveLocal()` runs first and is authoritative; every cloud
  mirror is a `try/catch`-guarded listener. Boot reconcile is bounded by a timeout so a slow/offline
  network can't stall startup.
- **First sign-in never overwrites.** On an empty cloud, the first sign-in *uploads* the local save; on a
  populated cloud, local and cloud are merged. Existing players lose nothing.

---

## 3. Owner setup — you already did most of this for Viva Maya

Turbo Maze **reuses the shared Viva Maya Supabase project** (`https://deskabqqxqqibxjffwmb.supabase.co`),
so the Google Cloud OAuth client and the Supabase Google provider are **already configured** — you do NOT
create a new OAuth app or a new project. Just three small, non-destructive steps (none touch Viva Maya):

### 3.1 Run the shared-table migration (once for the whole project)
In the project's **SQL Editor → New query**, paste the entire contents of
[`supabase/migrations/0001_game_saves.sql`](../supabase/migrations/0001_game_saves.sql) → **Run** (expect
"Success"; safe to re-run). This creates the shared `game_saves` table and does **not** touch Viva Maya's
`saves` table.

### 3.2 Add Turbo Maze's URLs to the redirect allow-list (additive — Viva Maya's entries stay)
**Authentication → URL Configuration → Redirect URLs → Add URL**, add both:
- `https://corruptfun.github.io/turbo-maze/**`
- `http://localhost:8765/**`  ← for local testing

Leave **Site URL** as Viva Maya's — Turbo Maze passes its own `redirectTo` explicitly, which only needs to
match a Redirect-URLs entry. (The Google Cloud redirect URI
`https://deskabqqxqqibxjffwmb.supabase.co/auth/v1/callback` is the *project's* callback and is already set —
nothing to add in Google Cloud Console.)

### 3.3 Wire the game (the same keys Viva Maya uses)
In `index.html`, find `SUPABASE_URL` and paste the project's values (Project Settings → API — the anon key
is the same one Viva Maya ships):
```js
const SUPABASE_URL      = "https://deskabqqxqqibxjffwmb.supabase.co";
const SUPABASE_ANON_KEY = "eyJ… the project's anon public key …";
```
Leave `GAME_ID = "turbo-maze"` as-is. Commit + push; GitHub Pages redeploys in a few minutes.

> **Google OAuth publish status & consent screen:** already handled for Viva Maya — the app is published
> with only non-sensitive scopes (email / profile / openid), so there's no verification screen and no
> user cap. Nothing to do here. (The consent screen will show the Viva Maya app name; if you later want it
> to read more generically across games, that's a cosmetic tweak in Google Cloud Console.)

---

## 4. Testing checklist

Local (dormant, before configuring): `python3 -m http.server 8765` → the game boots exactly as today,
Settings → **CLOUD & BACKUP** shows the "not switched on yet" note, and DevTools **Network** shows **no**
request for `vendor/supabase.umd.js`.

After configuring:
1. Settings → **CLOUD & BACKUP** shows **Sign in with Google**. Tapping it leaves to Google's consent
   screen and returns to the app.
2. Back in the app the modal shows **Signed in as …**.
3. **Cross-device:** sign in with the same Google account on a second device → progress appears.
4. **Cache-wipe recovery:** clear site data / reinstall the PWA → sign in again → progress restored.
5. **Backup file** (no account): **Download backup file**, then **Restore from a file** on another device.

> ⚠️ **Test on a REAL iPhone installed PWA.** The OAuth flow *leaves* the app to Google and *returns* on a
> fresh page load — confirm the session lands, syncs to a 2nd device, and survives clearing site data /
> reinstall. (This can't be fully exercised in a desktop test browser.)

---

## 5. How it behaves for a player

- **Signed out / no account:** nothing changes. Progress is on the device; they can sync by 4-word code or
  download a backup file.
- **Signs in with Google:** their current game is folded into the cloud (never overwritten), then every
  save auto-mirrors to the cloud. On any other device, signing in with the same account merges everything
  together.
- **New device / after a wipe:** sign in → the cloud save is pulled and merged in before they play.

---

## 6. Security

- Only the **anon / publishable** key ships in the client — this is expected and safe. RLS
  (`0001_game_saves.sql`) restricts every row to `auth.uid() = user_id`, so the key can only ever touch the
  signed-in user's own row.
- **Never** put the `service_role` key or the database password in `index.html` (or anywhere client-side).
- `.gitignore` already excludes `.env*`; there are no secrets in the repo beyond the safe anon key.

---

## 7. Relationship to the 4-word code (Cloudflare)

The two are independent optional mirrors of the same authoritative local save:

| | 4-word code (Cloudflare) | Google account (Supabase) |
|---|---|---|
| Identity | a memorable 4-word code | a Google account |
| Backend | Worker + KV | Supabase Postgres + Auth |
| Server-side merge | **yes** (worker merges on write) | no — client reconciles (§2) |
| Best for | quick kid-operated transfer | durable, automatic, cross-device |
| Deploy doc | [`CLOUD-SYNC.md`](CLOUD-SYNC.md) | this file |

Both use the same `syncMerge`. A player may use either or both; nothing is ever lost.
