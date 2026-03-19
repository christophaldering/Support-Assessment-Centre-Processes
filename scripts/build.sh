#!/bin/bash
#
# Build script for Executive Diagnostics Platform
#
# Flags:
#   --skip-install       Skip npm install + prisma generate (explicit)
#   --force-install      Force npm install even if node_modules exists
#
# Auto-detection: If node_modules/ exists and --force-install is not set,
# npm install is automatically skipped (safe for Replit VM deployments which
# copy node_modules from the workspace).

SKIP_INSTALL=false
FORCE_INSTALL=false

for arg in "$@"; do
  case "$arg" in
    --skip-install)  SKIP_INSTALL=true ;;
    --force-install) FORCE_INSTALL=true ;;
  esac
done

# Auto-detect: skip install if node_modules is already present (and not forced)
if [ "$SKIP_INSTALL" = false ] && [ "$FORCE_INSTALL" = false ] && [ -d "node_modules" ]; then
  echo "=== node_modules present — skipping npm install (use --force-install to override) ==="
  SKIP_INSTALL=true
fi

if [ "$SKIP_INSTALL" = false ]; then
  echo "=== Installing dependencies ==="
  # Use PIPESTATUS to detect npm install failures even when piping output
  npm install --production=false 2>&1 | tail -20
  INSTALL_EXIT=${PIPESTATUS[0]}
  if [ $INSTALL_EXIT -ne 0 ]; then
    echo "=== npm install failed (exit $INSTALL_EXIT) ==="
    if [ -d ".next/standalone" ]; then
      echo "=== Previous build exists, continuing without reinstall ==="
    else
      echo "=== FATAL: npm install failed and no previous build to fall back to. ==="
      exit 1
    fi
  fi

  echo "=== Generating Prisma client ==="
  npx prisma generate
else
  echo "=== Skipping npm install and prisma generate ==="
fi

echo "=== Building Next.js ==="
export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_TELEMETRY_DISABLED=1

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

  mv .next-build/standalone/.next-build .next-build/standalone/.next 2>/dev/null || true

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

  sed -i 's/\"distDir\":\".\/.next-build\"/\"distDir\":\".\/.next\"/g' .next-build/standalone/server.js 2>/dev/null || true

  cp -rn .next-build/static .next-build/standalone/.next/static 2>/dev/null || true
  cp -rn public .next-build/standalone/public 2>/dev/null || true

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
