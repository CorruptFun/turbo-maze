#!/usr/bin/env bash
# Deploy TURBO MAZE to GitHub Pages → https://corruptfun.github.io/turbo-maze/
#
# Bumps the service-worker CACHE_VERSION (so returning players get the in-game
# "New version ready → REFRESH" nudge), then commits everything and pushes to main.
# GitHub Pages redeploys automatically on push (~1 min).
#
# Usage:
#   scripts/deploy.sh "Your commit message"
#   scripts/deploy.sh                 # uses a default message
#
# Note: pushing to main IS the deploy. Make sure the working tree is what you want live.

set -euo pipefail
cd "$(dirname "$0")/.."

MSG="${1:-Deploy: ship latest build}"
STAMP="$(date +%Y%m%d-%H%M%S)"

# 1) Bump CACHE_VERSION → sw.js changes → browsers detect an update → the nudge fires.
if grep -q 'const CACHE_VERSION' sw.js 2>/dev/null; then
  sed -i.bak -E "s/const CACHE_VERSION *= *\"[^\"]*\";/const CACHE_VERSION = \"${STAMP}\";/" sw.js
  rm -f sw.js.bak
  echo "→ sw.js CACHE_VERSION = ${STAMP}"
else
  echo "⚠ sw.js / CACHE_VERSION not found — skipping version bump."
fi

# 2) Integrate anything pushed since we last pulled, then ship.
git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit — working tree clean. Aborting."
  exit 0
fi
git commit -m "${MSG}"
git pull --rebase --autostash
git push

echo ""
echo "✅ Pushed to main. GitHub Pages will rebuild shortly:"
echo "   https://corruptfun.github.io/turbo-maze/"
