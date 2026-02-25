#!/bin/bash
for i in $(seq 1 20); do
  if curl -s -o /dev/null -w '' http://localhost:5000/ 2>/dev/null; then
    curl -s -o /dev/null http://localhost:5000/ &
    curl -s -o /dev/null http://localhost:5000/w/aestimamus/login &
    curl -s -o /dev/null http://localhost:5000/w/arag &
    wait
    exit 0
  fi
  sleep 1
done
