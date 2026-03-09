#!/bin/bash
echo "=== Installing dependencies ==="
npm install --production=false 2>&1 | tail -5
echo "=== Build complete ==="
