// ─────────────────────────────────────────────────────────────────────────────
// Turbo Maze — cloud sync Worker  (Cloudflare Workers + KV)
// ─────────────────────────────────────────────────────────────────────────────
// One operation: SYNC. The client POSTs {code, store}; we load whatever that
// code already has in KV, JOIN it with the incoming state (most-progress-wins),
// write the joined result back, and return it. That single round-trip is BOTH
// a push and a pull — the returned blob is the union of every device that has
// ever used this code.
//
// The code IS the key. No accounts, no passwords, no email, no PII — right for
// a kids' app. A random 4-word code out of a ~300-word list is ~8 billion
// combos: unguessable enough, and there's nothing valuable to steal anyway.
//
// Deploy runbook: docs/CLOUD-SYNC.md.
// ─────────────────────────────────────────────────────────────────────────────

import { mergeStore } from "./merge.js";

const MAX_BODY = 3_000_000;                     // ~3 MB ceiling (ghosts are the bulk); KV allows 25 MB
const CODE_RE = /^[a-z]+(-[a-z]+){3}$/;         // exactly 4 hyphenated lowercase words

const CORS = {
  "Access-Control-Allow-Origin": "*",           // static game is served cross-origin (GitHub Pages)
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    // Liveness / smoke check — lets the deploy runbook confirm the URL is live.
    if (request.method === "GET") {
      return new Response("turbo-maze-sync ok", { headers: CORS });
    }

    if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);

    // Guard the body size — cheaply via Content-Length first, then for real after
    // reading (Content-Length is optional and spoofable, so it can't be trusted alone).
    const len = +(request.headers.get("content-length") || 0);
    if (len > MAX_BODY) return json({ ok: false, error: "too_big" }, 413);

    let text;
    try { text = await request.text(); } catch { return json({ ok: false, error: "bad_body" }, 400); }
    if (text.length > MAX_BODY) return json({ ok: false, error: "too_big" }, 413);

    let body;
    try { body = JSON.parse(text); } catch { return json({ ok: false, error: "bad_json" }, 400); }

    const code = typeof body?.code === "string" ? body.code.trim().toLowerCase() : "";
    if (code.length > 64 || !CODE_RE.test(code)) return json({ ok: false, error: "bad_code" }, 400);  // bound length: KV keys cap at 512 bytes
    if (!body || typeof body.store !== "object" || body.store === null) {
      return json({ ok: false, error: "bad_store" }, 400);
    }

    // Read the current cloud state. CRITICAL: a read that THROWS (a transient KV
    // error, or a stored value that won't JSON.parse) is NOT the same as "no data
    // yet". Treating an error as empty would let this device overwrite good cloud
    // data and permanently wipe another device's progress — the exact opposite of
    // the most-progress-wins guarantee, and it would strike hardest in the recovery
    // flow (dead device, cloud is the only copy). So: `null` == key absent (fine,
    // start from empty); a throw == ABORT the request and DO NOT write. The client
    // shows an error and simply retries against the real cloud next sync.
    let existing;
    try {
      const raw = await env.SYNC.get(code);
      existing = raw ? JSON.parse(raw) : {};
    } catch {
      return json({ ok: false, error: "read_failed" }, 503);
    }

    // The join. Returns synced fields only (device-local stays on the device).
    const merged = mergeStore(existing, body.store);

    const out = JSON.stringify(merged);
    if (out.length > MAX_BODY) return json({ ok: false, error: "too_big" }, 413);

    try {
      await env.SYNC.put(code, out);
    } catch {
      return json({ ok: false, error: "kv_write" }, 500);
    }

    return json({ ok: true, store: merged });
  },
};
