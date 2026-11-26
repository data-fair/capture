#!/usr/bin/env bash
# Idempotent preparation needed before the dev process and the tests: generated types, the
# browser. No containers.
# Usage: npm run dev-setup
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f config/type/.type/index.js ] || npm run build-types
# the chrome-headless-shell of the development and test config, the version that matches
# puppeteer (the image installs Debian's package instead); a no-op when already installed
npx --no puppeteer browsers install chrome-headless-shell
