// ─────────────────────────────────────────────────────────────────────────────
// Turbo Maze — "most-progress-wins" merge  (the heart of cloud sync)
// ─────────────────────────────────────────────────────────────────────────────
// This is a CRDT-style JOIN over a save blob. The result is >= both inputs on
// EVERY synced field (a join-semilattice), which gives us one guarantee that
// matters more than anything else for a 7-year-old's save:
//
//     an out-of-date device can NEVER permanently clobber newer progress.
//
// Because the merge is monotonic, concurrent devices that race a read-modify-
// write on KV can't lose data: the worst case is a briefly-stale value that
// heals on the next sync (every device periodically re-pushes its full state).
// This is why we do "merge / most-progress-wins" and NEVER "last-write-wins".
//
// A deliberate, documented consequence: currency & consumables (coinsBank,
// powerups) merge GENEROUSLY (max). Spending on device A and then syncing with
// a richer device B can effectively "refund" — that's the safe direction for a
// forgiving kids' game (never punish the kid), and it matches the roadmap spec
// ("max coins, union of owned…"). See docs/CLOUD-SYNC.md.
//
// ⚠️  KEEP IN SYNC with the inlined copy in index.html (search: "SYNC_MERGE").
//     The two copies must implement identical rules. worker/merge.js is
//     authoritative; the client copy is a belt-and-suspenders guard so progress
//     made during the network round-trip can never regress.
// ─────────────────────────────────────────────────────────────────────────────

// Numeric scalars → take the larger.
export const MAX_SCALARS = [
  "unlocked", "coinsBank", "aura", "coopUnlocked",
  "cratesOpened", "goldenFound", "nextTrackId",
];

// Boolean flags → once true anywhere, true everywhere.
export const OR_FLAGS = ["shopGift"];

// Maps keyed by id → per-key generous merge (numbers: max, else keep truthy).
// In-game these are all {key: <count or 1>}: stars/coopStars (star counts),
// upg (levels), powerups (counts), found/seenItems/goldTaken/seriesCleared (1s).
export const MAX_MAPS = [
  "stars", "coopStars", "upg", "powerups",
  "found", "seenItems", "goldTaken", "seriesCleared",
];

// Arrays → set union (dedupe by value / by JSON for objects).
export const UNION_ARRAYS = ["ownedCars", "ownedPets", "cosmetics"];

// Device-local — NEVER merged, NEVER stored server-side. The current car/pet
// selection, mute, and the sync code itself belong to the device in hand.
export const DEVICE_LOCAL = [
  "muted", "car", "pet", "cosmetic", "carNum", "curSeries", "armed", "syncCode",
];

function num(x) { return typeof x === "number" && isFinite(x) ? x : undefined; }

// Per-key generous merge: numbers → max; otherwise keep any truthy value.
function mergeMaxMap(a, b) {
  a = a || {}; b = b || {};
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const an = num(a[k]), bn = num(b[k]);
    if (an !== undefined || bn !== undefined) {
      out[k] = Math.max(an === undefined ? -Infinity : an, bn === undefined ? -Infinity : bn);
    } else {
      out[k] = a[k] || b[k];
    }
  }
  return out;
}

function unionArray(a, b) {
  const seen = new Set(), out = [];
  for (const v of [...(a || []), ...(b || [])]) {
    const key = (v && typeof v === "object") ? JSON.stringify(v) : v;
    if (!seen.has(key)) { seen.add(key); out.push(v); }
  }
  return out;
}

// ghosts: { [levelIx]: {t: seconds, d: base64} } — the ONE field where LOWER
// wins (best lap = lowest time), the opposite of every other rule.
function mergeGhosts(a, b) {
  a = a || {}; b = b || {};
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k], bv = b[k];
    if (!av) { out[k] = bv; continue; }
    if (!bv) { out[k] = av; continue; }
    const at = num(av.t), bt = num(bv.t);
    if (at === undefined) { out[k] = bv; continue; }
    if (bt === undefined) { out[k] = av; continue; }
    out[k] = at <= bt ? av : bv;   // lower time = better run
  }
  return out;
}

// customLevels: [{id, grid, ...}] — union that NEVER drops a distinct track.
// ids are minted from nextTrackId (a max-merged counter, so it CONVERGES across
// devices) — meaning two devices building offline can independently mint the SAME
// id for DIFFERENT tracks. Union-by-id would silently drop one. So we dedupe by
// CONTENT (id ignored), keep every distinct track, and reassign a fresh id
// whenever an id is missing or already taken. mergeStore() then bumps nextTrackId
// past the highest id so newly-built tracks can't re-collide.
function levelContentKey(lv) {
  if (!lv || typeof lv !== "object") return JSON.stringify(lv);
  const { id, ...rest } = lv;   // identity is the CONTENT, not the id
  return JSON.stringify(rest);
}
function mergeCustomLevels(a, b) {
  const all = [...(a || []), ...(b || [])];
  let maxId = 0;
  for (const lv of all) if (lv && typeof lv.id === "number" && lv.id > maxId) maxId = lv.id;
  const out = [], seenContent = new Set(), usedIds = new Set();
  for (const lv of all) {
    if (!lv) continue;
    const ck = levelContentKey(lv);
    if (seenContent.has(ck)) continue;                   // same track (ignoring id) already kept
    seenContent.add(ck);
    let id = (typeof lv.id === "number") ? lv.id : null;
    if (id === null || usedIds.has(id)) id = ++maxId;    // reassign on missing/collision — never drop a track
    usedIds.add(id);
    out.push(id === lv.id ? lv : Object.assign({}, lv, { id }));
  }
  return out;
}

// Join two save blobs. Returns ONLY synced fields (device-local excluded).
// Undefined-safe: an old save missing a field just contributes nothing for it.
export function mergeStore(a, b) {
  a = a || {}; b = b || {};
  const out = {};

  for (const k of MAX_SCALARS) {
    const an = num(a[k]), bn = num(b[k]);
    if (an !== undefined || bn !== undefined) {
      out[k] = Math.max(an === undefined ? -Infinity : an, bn === undefined ? -Infinity : bn);
    }
  }
  for (const k of OR_FLAGS) {
    if (a[k] !== undefined || b[k] !== undefined) out[k] = !!(a[k] || b[k]);
  }
  for (const k of MAX_MAPS) {
    if (a[k] !== undefined || b[k] !== undefined) out[k] = mergeMaxMap(a[k], b[k]);
  }
  for (const k of UNION_ARRAYS) {
    if (a[k] !== undefined || b[k] !== undefined) out[k] = unionArray(a[k], b[k]);
  }
  if (a.ghosts !== undefined || b.ghosts !== undefined) out.ghosts = mergeGhosts(a.ghosts, b.ghosts);
  if (a.customLevels !== undefined || b.customLevels !== undefined) {
    out.customLevels = mergeCustomLevels(a.customLevels, b.customLevels);
    let hi = 0;
    for (const lv of out.customLevels) if (lv && typeof lv.id === "number" && lv.id > hi) hi = lv.id;
    out.nextTrackId = Math.max(out.nextTrackId || 0, hi);   // keep the id counter ahead of every track so new ones can't recollide
  }

  return out;
}
