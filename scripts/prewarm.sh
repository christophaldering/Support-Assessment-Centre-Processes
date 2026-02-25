#!/bin/bash
sleep 3
for i in 1 2 3 4 5; do
  if curl -s -o /dev/null -w '' http://localhost:5000/ 2>/dev/null; then
    curl -s -o /dev/null http://localhost:5000/w/aestimamus/login 2>/dev/null
    curl -s -o /dev/null http://localhost:5000/ 2>/dev/null
    curl -s -o /dev/null http://localhost:5000/arag-bdp/gate 2>/dev/null
    exit 0
  fi
  sleep 2
done
