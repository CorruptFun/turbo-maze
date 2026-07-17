// Local stand-in for the Cloudflare Worker — same /sync contract, an in-memory
// Map instead of KV. Lets us prove the full client round-trip in a real browser
// BEFORE the Cloudflare account exists.
//
//   node worker/mock-server.js            # listens on :8787
//   then point the game at it:  localStorage.tmSyncUrl = "http://localhost:8787"
//
// Uses the SAME merge.js as the real Worker, so an offline pass here exercises
// the exact join the production Worker will run.

import http from "node:http";
import { mergeStore } from "./merge.js";

const PORT = +(process.env.PORT || 8787);
const CODE_RE = /^[a-z]+(-[a-z]+){3}$/;
const KV = new Map();   // code -> JSON string (mirrors what real KV stores)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const send = (res, status, obj, extra = {}) => {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS, ...extra });
  res.end(JSON.stringify(obj));
};

http.createServer((req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  if (req.method === "GET") { res.writeHead(200, CORS); return res.end("turbo-maze-sync mock ok"); }
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "method" });

  let body = "";
  req.on("data", (c) => { body += c; if (body.length > 3_000_000) req.destroy(); });
  req.on("end", () => {
    let parsed;
    try { parsed = JSON.parse(body); } catch { return send(res, 400, { ok: false, error: "bad_json" }); }
    const code = typeof parsed?.code === "string" ? parsed.code.trim().toLowerCase() : "";
    if (code.length > 64 || !CODE_RE.test(code)) return send(res, 400, { ok: false, error: "bad_code" });
    if (!parsed || typeof parsed.store !== "object" || parsed.store === null) {
      return send(res, 400, { ok: false, error: "bad_store" });
    }
    // mirror the Worker: a read that THROWS aborts (never overwrite good data with empty)
    let existing;
    try { const raw = KV.get(code); existing = raw ? JSON.parse(raw) : {}; }
    catch { return send(res, 503, { ok: false, error: "read_failed" }); }
    const merged = mergeStore(existing, parsed.store);
    KV.set(code, JSON.stringify(merged));
    console.log(`sync ${code}  ->  ${Object.keys(merged).length} fields, ${KV.size} codes stored`);
    send(res, 200, { ok: true, store: merged });
  });
}).listen(PORT, () => console.log(`turbo-maze mock sync on http://localhost:${PORT}`));
