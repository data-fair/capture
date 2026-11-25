#!/usr/bin/env bash
# Minimal dev environment: the api, in this terminal. Ctrl+C stops it.
# Usage: npm run dev
set -euo pipefail
cd "$(dirname "$0")/.."

bash dev/deps.sh
npm run dev-setup

set -a
. ./.env
set +a

echo "test screenshot at http://localhost:$DEV_API_PORT/api/v1/screenshot?target=http://localhost:$DEV_API_PORT/test/resources/test1.html"
exec npm run dev:api
