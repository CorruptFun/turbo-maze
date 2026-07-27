// ─────────────────────────────────────────────────────────────────────────────
// Turbo Maze — SELF-HOSTED cloud sync server  (Node, no deps, runs on the Mac)
// ─────────────────────────────────────────────────────────────────────────────
// The Cloudflare Worker's twin for people who'd rather run the backend on their
// own always-on machine: same contract (POST {code, store} → {ok, store}), same
// merge.js join, same data-safety rule (a failed READ aborts the request — we
// never risk clobbering good data with empty). Storage is one JSON file per
// code instead of KV.
//
//   node worker/server-local.js                      # listens on 0.0.0.0:8787
//   PORT=9000 DATA_DIR=/tmp/x node worker/server-local.js
//
// Run it 24/7 via launchd: scripts/sync-server-install.sh (see docs/CLOUD-SYNC.md,
// "Self-hosting" section — including the mixed-content settings devices need
// before an https page may call a plain-http home server).
// ─────────────────────────────────────────────────────────────────────────────

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { mergeStore } from "./merge.js";

const PORT = +(process.env.PORT || 8787);
const BIND = process.env.BIND || "0.0.0.0";
const DATA_DIR = process.env.DATA_DIR || path.join(os.homedir(), "Library", "Application Support", "turbo-maze-sync");

const MAX_BODY = 3_000_000;                    // ~3 MB — matches the Worker
const MAX_CODES = 5000;                        // new-code ceiling: a misbehaving client can't fill the disk
const CODE_RE = /^[a-z]+(-[a-z]+){3}$/;        // 4 hyphenated words — also makes the filename traversal-proof

fs.mkdirSync(DATA_DIR, { recursive: true });

const CORS = {
  "Access-Control-Allow-Origin": "*",          // the game is served cross-origin (GitHub Pages / localhost dev)
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};
const send = (res, status, obj) => {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify(obj));
};
const log = (msg) => console.log(`${new Date().toISOString()}  ${msg}`);

const fileFor = (code) => path.join(DATA_DIR, code + ".json");

http.createServer((req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  if (req.method === "GET") {                  // liveness — lets the runbook curl-check the URL
    res.writeHead(200, { "Content-Type": "text/plain", ...CORS });
    return res.end("turbo-maze-sync local ok");
  }
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "method" });

  let body = "";
  let tooBig = false;
  req.on("data", (c) => { body += c; if (body.length > MAX_BODY) { tooBig = true; req.destroy(); } });
  req.on("error", () => {});                   // destroyed request → nothing to answer
  req.on("end", () => {
    if (tooBig) return send(res, 413, { ok: false, error: "too_big" });
    let parsed;
    try { parsed = JSON.parse(body); } catch { return send(res, 400, { ok: false, error: "bad_json" }); }
    const code = typeof parsed?.code === "string" ? parsed.code.trim().toLowerCase() : "";
    if (code.length > 64 || !CODE_RE.test(code)) return send(res, 400, { ok: false, error: "bad_code" });
    if (!parsed || typeof parsed.store !== "object" || parsed.store === null) {
      return send(res, 400, { ok: false, error: "bad_store" });
    }

    const file = fileFor(code);
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}   // heal a vanished data dir (cleanup tools, migrations)

    // Same abort rule as the Worker: file-absent == empty (fine), but an UNREADABLE
    // or CORRUPT file must abort — never merge against "empty" when real data may
    // exist, or a fresh device could wipe the family's progress.
    let existing = {};
    try {
      if (fs.existsSync(file)) existing = JSON.parse(fs.readFileSync(file, "utf8"));
      else if (fs.readdirSync(DATA_DIR).length >= MAX_CODES) return send(res, 507, { ok: false, error: "full" });
    } catch { return send(res, 503, { ok: false, error: "read_failed" }); }

    const merged = mergeStore(existing, parsed.store);
    const out = JSON.stringify(merged);
    if (out.length > MAX_BODY) return send(res, 413, { ok: false, error: "too_big" });

    try {                                       // atomic: tmp + rename → a crash mid-write can't torch the old save
      const tmp = file + ".tmp-" + process.pid;
      fs.writeFileSync(tmp, out);
      fs.renameSync(tmp, file);
    } catch { return send(res, 500, { ok: false, error: "write_failed" }); }

    log(`sync ${code}  ${body.length}B in → ${out.length}B stored`);
    send(res, 200, { ok: true, store: merged });
  });
}).listen(PORT, BIND, () => log(`turbo-maze sync server on http://${BIND}:${PORT}  (data: ${DATA_DIR})`));
