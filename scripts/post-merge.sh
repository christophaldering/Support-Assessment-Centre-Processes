#!/bin/bash
# Post-merge setup script — rebuilds Next.js standalone after a task merge.
# Does NOT run npm install (blocked by a tiptap package 404 in this project).
# The workflow restart (handled automatically) will start the server after this.
set -e

export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_TELEMETRY_DISABLED=1

echo "[post-merge] Rebuilding Next.js standalone..."

rm -rf .next-build

NEXT_BUILD_DIR=.next-build npx next build

echo "[post-merge] Build succeeded — assembling standalone..."

mv .next-build/standalone/.next-build .next-build/standalone/.next 2>/dev/null || true

node -e "
  const fs = require('fs');
  const p = '.next-build/standalone/.next/required-server-files.json';
  if (fs.existsSync(p)) {
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    d.config.distDir = './.next';
    fs.writeFileSync(p, JSON.stringify(d));
    console.log('[post-merge] Fixed distDir');
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

echo "[post-merge] Standalone ready."
