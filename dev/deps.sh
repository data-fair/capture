#!/usr/bin/env bash
# Prepare the dev dependencies. capture has no containers: in development it runs without
# authentication (no privateDirectoryUrl), so this only writes .env.
# Usage: npm run dev-deps
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp dev/default.env .env
  echo "created .env from dev/default.env (edit .env to override, it is never overwritten)"
fi
