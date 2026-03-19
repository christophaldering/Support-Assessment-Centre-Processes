#!/bin/bash
# Combined build + start script
# Builds if no standalone exists (or --rebuild is passed), then starts production server

FORCE_REBUILD=false
for arg in "$@"; do
  [ "$arg" = "--rebuild" ] && FORCE_REBUILD=true
done

STANDALONE=".next/standalone/server.js"

if [ ! -f "$STANDALONE" ] || [ "$FORCE_REBUILD" = "true" ]; then
  if [ "$FORCE_REBUILD" = "true" ]; then
    echo "[build-start] --rebuild flag set — forcing fresh build..."
  else
    echo "[build-start] No standalone build found — running build now..."
  fi
  echo "[build-start] This takes 3-6 minutes. App will start after build completes."

  export NODE_OPTIONS="--max-old-space-size=8192"
  export NEXT_TELEMETRY_DISABLED=1

  rm -rf .next-build

  echo "[build-start] === Compiling ==="
  NEXT_BUILD_DIR=.next-build npx next build
  BUILD_EXIT=$?

  if [ $BUILD_EXIT -ne 0 ]; then
    echo "[build-start] Build FAILED (exit $BUILD_EXIT) — falling back to dev mode"
    exec node scripts/wrapper.js
  fi

  echo "[build-start] === Build succeeded — assembling standalone ==="

  mv .next-build/standalone/.next-build .next-build/standalone/.next 2>/dev/null || true

  node -e "
    const fs = require('fs');
    const p = '.next-build/standalone/.next/required-server-files.json';
    if (fs.existsSync(p)) {
      const d = JSON.parse(fs.readFileSync(p, 'utf8'));
      d.config.distDir = './.next';
      fs.writeFileSync(p, JSON.stringify(d));
      console.log('[build-start] Fixed distDir');
    }
  "

  sed -i 's/\"distDir\":\".\/.next-build\"/\"distDir\":\".\/.next\"/g' \
    .next-build/standalone/server.js 2>/dev/null || true

  cp -rn .next-build/static .next-build/standalone/.next/static 2>/dev/null || true
  cp -rn public .next-build/standalone/public 2>/dev/null || true

  rm -rf .next-old
  [ -d ".next" ] && mv .next .next-old
  mv .next-build .next
  rm -rf .next-old

  echo "[build-start] === Standalone ready — starting production server ==="
else
  echo "[build-start] Standalone build found — starting production server directly"
fi

exec node scripts/wrapper.js
