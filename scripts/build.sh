#!/bin/bash
echo "=== Installing dependencies ==="
npm install --production=false 2>&1 | tail -5

echo "=== Generating Prisma client ==="
npx prisma generate

echo "=== Building Next.js ==="
export NODE_OPTIONS="--max-old-space-size=8192"

rm -rf .next-build

echo "=== Running build with isolated output dir ==="
NEXT_BUILD_DIR=.next-build npx next build 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  echo "=== Build failed (exit $BUILD_EXIT) ==="
  rm -rf .next-build

  if [ -d ".next/standalone" ]; then
    echo "=== Previous build exists, keeping it ==="
  else
    echo "=== FATAL: No previous build to fall back to. Deployment will fail. ==="
    exit 1
  fi
else
  echo "=== Build succeeded, preparing standalone ==="

  mv .next-build/standalone/.next-build .next-build/standalone/.next 2>/dev/null

  node -e "
    const fs = require('fs');
    const p = '.next-build/standalone/.next/required-server-files.json';
    if (fs.existsSync(p)) {
      const d = JSON.parse(fs.readFileSync(p, 'utf8'));
      d.config.distDir = './.next';
      fs.writeFileSync(p, JSON.stringify(d));
      console.log('Fixed distDir in required-server-files.json');
    }
  "

  sed -i 's/\"distDir\":\".\/.next-build\"/\"distDir\":\".\/.next\"/g' .next-build/standalone/server.js

  cp -rn .next-build/static .next-build/standalone/.next/static 2>/dev/null
  cp -rn public .next-build/standalone/public 2>/dev/null

  echo "=== Swapping .next ==="
  rm -rf .next-old
  if [ -d ".next" ]; then
    mv .next .next-old
  fi
  mv .next-build .next
  rm -rf .next-old
  echo "=== Standalone build ready ==="
  ls -la .next/standalone/server.js 2>/dev/null
fi

echo "=== Build step complete ==="
