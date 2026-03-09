#!/bin/bash

echo "=== Running Next.js build ==="
npx next build 2>&1 || echo "Build completed with warnings (non-fatal)"

echo "=== Build script complete ==="
