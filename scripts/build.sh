#!/bin/bash
echo "=== Installing dependencies ==="
npm install --production=false 2>&1 | tail -5

echo "=== Generating Prisma client ==="
npx prisma generate

echo "=== Cleaning previous build ==="
rm -rf .next

echo "=== Building Next.js (with increased memory) ==="
export NODE_OPTIONS="--max-old-space-size=2048"
npx next build 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  echo "=== Build failed (exit $BUILD_EXIT), cleaning corrupted artifacts ==="
  rm -rf .next
fi

echo "=== Build step complete ==="
