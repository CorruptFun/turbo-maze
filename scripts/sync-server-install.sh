#!/usr/bin/env bash
# Install (or remove) the Turbo Maze SELF-HOSTED sync server as a 24/7 launchd
# service on this Mac. The server is worker/server-local.js — same contract and
# merge as the Cloudflare Worker, storage in ~/Library/Application Support/turbo-maze-sync.
#
#   scripts/sync-server-install.sh              # install (or refresh) + start + verify
#   scripts/sync-server-install.sh --status     # is it loaded + answering?
#   scripts/sync-server-install.sh --uninstall  # stop + remove (save data is kept)
#
# Full setup — including pointing devices at it with ?sync= and the mixed-content
# settings they need — lives in docs/CLOUD-SYNC.md, "Self-hosting" section.

set -euo pipefail

LABEL="com.turbomaze.sync"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/turbo-maze-sync.log"
PORT="${PORT:-8787}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$REPO/worker/server-local.js"
UID_NUM="$(id -u)"

status() {
  if launchctl print "gui/$UID_NUM/$LABEL" &>/dev/null; then echo "service: loaded ($LABEL)"; else echo "service: NOT loaded"; fi
  if OUT="$(curl -fsS --max-time 3 "http://localhost:$PORT/" 2>/dev/null)"; then echo "server:  $OUT (port $PORT)"; else echo "server:  NOT answering on :$PORT (log: $LOG)"; fi
}

case "${1:-}" in
  --status) status; exit 0 ;;
  --uninstall)
    launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "✅ $LABEL removed. Save data kept in: ~/Library/Application Support/turbo-maze-sync"
    exit 0 ;;
esac

NODE_BIN="$(command -v node || true)"
[ -n "$NODE_BIN" ] || { echo "❌ node not found on PATH — install Node first."; exit 1; }
[ -f "$SERVER" ]   || { echo "❌ $SERVER not found."; exit 1; }

# The plist pins THIS node's absolute path (launchd knows nothing about nvm).
# Re-run this script after upgrading/removing that Node version.
mkdir -p "$(dirname "$PLIST")"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array>
    <string>$NODE_BIN</string>
    <string>$SERVER</string>
  </array>
  <key>EnvironmentVariables</key><dict><key>PORT</key><string>$PORT</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict></plist>
EOF

launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true   # clean refresh if already installed
launchctl bootstrap "gui/$UID_NUM" "$PLIST"
sleep 1
status

IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo '<this-macs-ip>')"
echo ""
echo "Point a device at it by opening this once (kiosk start-URLs can keep the param):"
echo "  https://corruptfun.github.io/turbo-maze/?sync=http://$IP:$PORT"
