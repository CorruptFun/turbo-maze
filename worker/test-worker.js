// Worker-level tests — guard the fetch handler's contract, above all the
// read-failure abort (the finding that could permanently wipe a cloud save).
// Run with:  node worker/test-worker.js   (Node 18+ for global Request/Response)

import worker from "./worker.js";

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) pass++; else { fail++; console.error("  ✗ " + name); } }

// fake KV: get is whatever we inject; put records calls so we can assert "never wrote".
function makeEnv(getImpl) {
  const puts = [];
  return { puts, SYNC: { get: getImpl, put: async (k, v) => { puts.push([k, v]); } } };
}
const CODE = "tiger-comet-mango-turbo";
const post = (obj) => new Request("https://x/sync", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj),
});

const tests = [
  // ── the critical one: a read that THROWS must abort, never overwrite ──
  async () => {
    const env = makeEnv(async () => { throw new Error("kv down"); });
    const res = await worker.fetch(post({ code: CODE, store: { unlocked: 1 } }), env);
    ok("KV read error -> 503 (not treated as empty)", res.status === 503);
    ok("KV read error -> NO put (cloud left intact)", env.puts.length === 0);
  },
  async () => {
    const env = makeEnv(async () => "{not valid json");
    const res = await worker.fetch(post({ code: CODE, store: { unlocked: 9, coinsBank: 999 } }), env);
    ok("corrupt cloud value -> 503", res.status === 503);
    ok("corrupt cloud value -> NO overwrite", env.puts.length === 0);
  },
  // ── absent key (null) is legitimately empty: proceed and write ──
  async () => {
    const env = makeEnv(async () => null);
    const res = await worker.fetch(post({ code: CODE, store: { unlocked: 3, coinsBank: 20 } }), env);
    const data = await res.json();
    ok("absent key -> 200 ok", res.status === 200 && data.ok);
    ok("absent key -> put called once", env.puts.length === 1);
    ok("absent key -> returns device state", data.store.unlocked === 3 && data.store.coinsBank === 20);
  },
  // ── stale device cannot lower a richer cloud (most-progress-wins end to end) ──
  async () => {
    const env = makeEnv(async () => JSON.stringify({ unlocked: 7, coinsBank: 500, stars: { 0: 3 } }));
    const res = await worker.fetch(post({ code: CODE, store: { unlocked: 1, coinsBank: 0 } }), env);
    const data = await res.json();
    ok("stale device can't lower cloud", data.store.unlocked === 7 && data.store.coinsBank === 500);
    ok("device-local not in returned blob", !("muted" in data.store) && !("car" in data.store));
  },
  // ── validation ──
  async () => {
    const env = makeEnv(async () => null);
    const res = await worker.fetch(post({ code: "nope", store: {} }), env);
    ok("bad code -> 400", res.status === 400);
    ok("bad code -> no put", env.puts.length === 0);
  },
  async () => {
    const env = makeEnv(async () => null);
    const longCode = Array(30).fill("word").join("-");   // > 64 chars / > KV key sanity
    const res = await worker.fetch(post({ code: longCode, store: {} }), env);
    ok("overlong code -> clean 400 (not a 500)", res.status === 400);
  },
  async () => {
    const env = makeEnv(async () => null);
    const res = await worker.fetch(post({ code: CODE }), env);   // no store
    ok("missing store -> 400", res.status === 400);
  },
  // ── CORS preflight ──
  async () => {
    const env = makeEnv(async () => null);
    const res = await worker.fetch(new Request("https://x", { method: "OPTIONS" }), env);
    ok("OPTIONS -> CORS ACAO *", res.headers.get("Access-Control-Allow-Origin") === "*");
  },
];

for (const t of tests) await t();
console.log(`\nworker tests: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
