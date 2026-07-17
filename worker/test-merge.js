// Offline proof of the merge — no deps, run with:  node worker/test-merge.js
// Exit code 0 = all green. This is the crux; if it passes, cloud sync is safe
// even before the Cloudflare account exists.

import {
  mergeStore, MAX_SCALARS, MAX_MAPS, UNION_ARRAYS, OR_FLAGS, DEVICE_LOCAL,
} from "./merge.js";

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error("  ✗ " + name); }
}
function eq(name, a, b) { ok(name, JSON.stringify(a) === JSON.stringify(b)); }

// ── field rules ──────────────────────────────────────────────────────────────
(function scalars() {
  const m = mergeStore({ unlocked: 3, coinsBank: 100, aura: 2 },
                       { unlocked: 7, coinsBank: 40, aura: 9 });
  ok("scalar unlocked = max", m.unlocked === 7);
  ok("scalar coinsBank = max (never last-write)", m.coinsBank === 100);
  ok("scalar aura = max", m.aura === 9);
})();

(function scalarsMissingSide() {
  eq("scalar only on A survives", mergeStore({ coinsBank: 50 }, {}).coinsBank, 50);
  eq("scalar only on B survives", mergeStore({}, { coinsBank: 50 }).coinsBank, 50);
  ok("no field when neither has it", !("aura" in mergeStore({}, {})));
})();

(function maps() {
  const m = mergeStore(
    { stars: { 0: 3, 1: 1 }, upg: { engine: 2, grip: 0 }, found: { "pu:rocket": 1 } },
    { stars: { 1: 3, 2: 2 }, upg: { engine: 1, nitro: 4 }, found: { "cos:flame": 1 } },
  );
  eq("stars = per-key max union", m.stars, { 0: 3, 1: 3, 2: 2 });
  eq("upg = per-key max union", m.upg, { engine: 2, grip: 0, nitro: 4 });
  eq("found ledger = union of keys", m.found, { "pu:rocket": 1, "cos:flame": 1 });
})();

(function powerupsGenerous() {
  // consumables merge generously (max) — documented "never punish the kid".
  const m = mergeStore({ powerups: { rocket: 1 } }, { powerups: { rocket: 5, shield: 2 } });
  eq("powerups = per-key max", m.powerups, { rocket: 5, shield: 2 });
})();

(function unions() {
  const m = mergeStore(
    { ownedCars: ["rocket", "van"], ownedPets: ["boone"], cosmetics: ["trail_flame"] },
    { ownedCars: ["rocket", "ufo"], ownedPets: [], cosmetics: ["trail_ice"] },
  );
  eq("ownedCars = dedup union", m.ownedCars.sort(), ["rocket", "ufo", "van"]);
  eq("ownedPets union", m.ownedPets, ["boone"]);
  eq("cosmetics union", m.cosmetics.sort(), ["trail_flame", "trail_ice"]);
})();

(function flags() {
  ok("shopGift OR: F|T -> T", mergeStore({ shopGift: false }, { shopGift: true }).shopGift === true);
  ok("shopGift OR: F|F -> F", mergeStore({ shopGift: false }, { shopGift: false }).shopGift === false);
})();

(function ghostsMinTime() {
  const a = { ghosts: { 0: { t: 12.5, d: "A0" }, 1: { t: 9.0, d: "A1" } } };
  const b = { ghosts: { 0: { t: 8.2, d: "B0" }, 2: { t: 5.0, d: "B2" } } };
  const m = mergeStore(a, b);
  ok("ghost 0 keeps FASTER run (b)", m.ghosts[0].d === "B0" && m.ghosts[0].t === 8.2);
  ok("ghost 1 only on A survives", m.ghosts[1].d === "A1");
  ok("ghost 2 only on B survives", m.ghosts[2].d === "B2");
})();

(function ghostsMinTieAndBad() {
  const m = mergeStore({ ghosts: { 0: { t: 7, d: "A" } } }, { ghosts: { 0: { t: 7, d: "B" } } });
  ok("ghost tie keeps one (a)", m.ghosts[0].d === "A");
  const m2 = mergeStore({ ghosts: { 0: { d: "noT" } } }, { ghosts: { 0: { t: 9, d: "hasT" } } });
  ok("ghost with valid time beats malformed", m2.ghosts[0].d === "hasT");
})();

(function customLevelsNeverDropDistinct() {
  // id-2 collision with DIFFERENT content (two offline devices minting the same
  // id for different tracks) -> BOTH survive, one reassigned. Never dropped.
  const a = { customLevels: [{ id: 1, grid: ["##"] }, { id: 2, grid: ["AAA"] }], nextTrackId: 2 };
  const b = { customLevels: [{ id: 2, grid: ["BBB"] }, { id: 3, grid: ["oo"] }], nextTrackId: 3 };
  const m = mergeStore(a, b);
  eq("no distinct track dropped on id-collision",
     m.customLevels.map(l => l.grid[0]).sort(), ["##", "AAA", "BBB", "oo"]);
  const ids = m.customLevels.map(l => l.id);
  ok("all ids unique after merge", new Set(ids).size === ids.length);
  ok("nextTrackId bumped past every id (no future recollision)", m.nextTrackId >= Math.max(...ids));
})();

(function customLevelsSameContentDedup() {
  // the SAME track synced from both devices dedupes to one (id ignored for identity).
  const a = { customLevels: [{ id: 5, grid: ["ZZ"], name: "loop" }] };
  const b = { customLevels: [{ id: 5, grid: ["ZZ"], name: "loop" }] };
  ok("identical track dedupes to one", mergeStore(a, b).customLevels.length === 1);
  // same content, DIFFERENT id (built then re-id'd) still dedupes — content is identity.
  const c = { customLevels: [{ id: 8, grid: ["QQ"] }] };
  const d = { customLevels: [{ id: 9, grid: ["QQ"] }] };
  ok("same content diff id dedupes", mergeStore(c, d).customLevels.length === 1);
})();

// ── CRDT properties ──────────────────────────────────────────────────────────
const DEVICE_A = {
  unlocked: 5, coinsBank: 320, aura: 4, coopUnlocked: 2, cratesOpened: 11, goldenFound: 1, nextTrackId: 3,
  stars: { 0: 3, 1: 2, 2: 3 }, coopStars: { 0: 2 }, upg: { engine: 3, grip: 1 }, powerups: { rocket: 2 },
  found: { "pu:rocket": 1, "upg:engine": 1 }, seenItems: { "pu:rocket": 1 }, goldTaken: { 3: 1 }, seriesCleared: { 0: 1 },
  ownedCars: ["rocket", "van"], ownedPets: ["boone"], cosmetics: ["trail_flame"], shopGift: true,
  ghosts: { 0: { t: 11.2, d: "A0" }, 1: { t: 8.4, d: "A1" } },
  customLevels: [{ id: 1, grid: ["a"] }],
  // device-local:
  muted: true, car: "van", pet: "boone", carNum: 12, curSeries: 2, cosmetic: "trail_flame", armed: "rocket", syncCode: "aaa-bbb-ccc-ddd",
};
const DEVICE_B = {
  unlocked: 3, coinsBank: 90, aura: 9, coopUnlocked: 4, cratesOpened: 6, goldenFound: 4, nextTrackId: 2,
  stars: { 1: 3, 3: 1 }, coopStars: { 0: 1, 1: 3 }, upg: { engine: 1, nitro: 5 }, powerups: { rocket: 1, shield: 3 },
  found: { "cos:flame": 1 }, seenItems: {}, goldTaken: { 5: 1 }, seriesCleared: { 1: 1 },
  ownedCars: ["rocket", "ufo"], ownedPets: [], cosmetics: ["trail_ice"], shopGift: false,
  ghosts: { 0: { t: 9.9, d: "B0" }, 2: { t: 6.1, d: "B2" } },
  customLevels: [{ id: 2, grid: ["b"] }],
  muted: false, car: "ufo", pet: null, carNum: 67, curSeries: 0, cosmetic: null, armed: null, syncCode: "eee-fff-ggg-hhh",
};

(function idempotent() {
  const once = mergeStore(DEVICE_A, DEVICE_B);
  const twice = mergeStore(once, once);
  eq("merge is idempotent (join(x,x) == x)", twice, once);
})();

(function commutative() {
  const ab = mergeStore(DEVICE_A, DEVICE_B);
  const ba = mergeStore(DEVICE_B, DEVICE_A);
  // Map key-insertion order and union order differ by argument order but the
  // CONTENT is identical — canonicalize (deep-sort keys, sort unions, reduce
  // customLevels to its id set) before comparing.
  const canon = (v) => {
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = canon(v[k]);
      return out;
    }
    return v;
  };
  const norm = (o) => {
    const c = JSON.parse(JSON.stringify(o));
    for (const k of UNION_ARRAYS) if (c[k]) c[k].sort();
    if (c.customLevels) c.customLevels = c.customLevels.map(l => l.id).sort();
    return canon(c);
  };
  eq("merge is commutative (order-insensitive)", norm(ab), norm(ba));
})();

(function deviceLocalExcluded() {
  const m = mergeStore(DEVICE_A, DEVICE_B);
  const leaked = DEVICE_LOCAL.filter(k => k in m);
  ok("device-local fields never appear in merge output: " + leaked.join(","), leaked.length === 0);
})();

(function monotoneScalars() {
  const m = mergeStore(DEVICE_A, DEVICE_B);
  let mono = true;
  for (const k of MAX_SCALARS) if (m[k] < Math.max(DEVICE_A[k], DEVICE_B[k])) mono = false;
  ok("every scalar >= max(inputs)", mono);
})();

(function monotoneMapsNoLoss() {
  const m = mergeStore(DEVICE_A, DEVICE_B);
  let loss = false;
  for (const map of MAX_MAPS) {
    for (const src of [DEVICE_A, DEVICE_B]) {
      for (const [k, v] of Object.entries(src[map] || {})) {
        if (typeof v === "number" && (m[map][k] === undefined || m[map][k] < v)) loss = true;
      }
    }
  }
  ok("no map key regresses below either input", !loss);
})();

(function noStarEverLost() {
  // The scenario that must never happen: stale device syncs, kid loses a star.
  const rich = { stars: { 0: 3, 1: 3, 2: 3, 3: 3 }, unlocked: 5, coinsBank: 500 };
  const stale = { stars: { 0: 1 }, unlocked: 1, coinsBank: 0 };
  const m1 = mergeStore(rich, stale);   // rich pushes, stale is in cloud
  const m2 = mergeStore(stale, rich);   // stale pushes AFTER rich (worst case)
  eq("stale-after-rich keeps all stars", m2.stars, { 0: 3, 1: 3, 2: 3, 3: 3 });
  ok("stale-after-rich keeps unlocked", m2.unlocked === 5);
  ok("stale-after-rich keeps coins", m2.coinsBank === 500);
  eq("order doesn't matter for progress", m1.stars, m2.stars);
})();

(function emptyAndUndefinedSafe() {
  eq("merge({},{}) == {}", mergeStore({}, {}), {});
  eq("merge(undef,undef) == {}", mergeStore(undefined, undefined), {});
  const m = mergeStore({ stars: { 0: 3 } }, undefined);
  eq("merge with undefined side preserves stars", m.stars, { 0: 3 });
})();

// ── report ───────────────────────────────────────────────────────────────────
console.log(`\nmerge tests: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
