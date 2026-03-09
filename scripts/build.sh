#!/bin/bash
echo "=== Installing dependencies ==="
npm install --production=false 2>&1 | tail -5

echo "=== Generating Prisma client ==="
npx prisma generate

echo "=== Building Next.js ==="
export NODE_OPTIONS="--max-old-space-size=4096"

if [ -d ".next/standalone" ]; then
  echo "=== Existing build found, building into temp directory ==="
  mv .next .next-backup
  npx next build 2>&1
  BUILD_EXIT=$?

  if [ $BUILD_EXIT -ne 0 ]; then
    echo "=== Build failed (exit $BUILD_EXIT), restoring previous build ==="
    rm -rf .next
    mv .next-backup .next
    echo "=== Previous build restored, server will use existing standalone ==="
  else
    echo "=== Build succeeded, removing old build ==="
    rm -rf .next-backup
  fi
else
  echo "=== No existing build, building fresh ==="
  rm -rf .next
  npx next build 2>&1
  BUILD_EXIT=$?

  if [ $BUILD_EXIT -ne 0 ]; then
    echo "=== Build failed (exit $BUILD_EXIT), cleaning corrupted artifacts ==="
    rm -rf .next
    echo "=== FATAL: No previous build to fall back to. Deployment will fail. ==="
    exit 1
  fi
fi

echo "=== Build step complete ==="
