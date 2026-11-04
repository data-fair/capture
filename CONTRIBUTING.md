# Contribution guidelines

## Prerequisites

- Node.js, the version of `.nvmrc` (start zellij from a shell on it: the panes inherit its PATH)
- zellij >= 0.44
- google-chrome-stable (`/usr/bin/google-chrome-stable`, the `executablePath` of `config/default.cjs`)
  and gifsicle (animated captures), installed on your system

## Setup

The dev environment is the shared one of the data-fair services (`@data-fair/lib-dev`): a zellij
session per checkout, described by `.zellij.kdl` and `dev/dev.json`. No containers: in development
capture runs without authentication (no `privateDirectoryUrl`).

1. Install dependencies (puppeteer's own browser download is not needed), then write `.env` (free
   ports drawn for this checkout) and build the types:
   ```bash
   PUPPETEER_SKIP_DOWNLOAD=true npm ci
   npx --no df-dev setup
   ```

2. Start the session:
   ```bash
   npm run dev-zellij
   ```
   The footer pane prints the URL of a test screenshot. `npx --no df-dev status` shows what runs,
   `npx --no df-dev logs api` prints the API's output.

3. A new branch in its own worktree, from the main checkout:
   ```bash
   npx --no df-worktree <branch>          # creates ../capture_<branch>, npm ci + setup
   npx --no df-worktree-delete <branch>   # removes it with its zellij session
   ```
   Branch names: letters, digits, `.`, `_`, `-`, no `/`, and `capture_<branch>` at most 60 characters.

## Tests

    npm test
    npm run test-base test-it/capture.ts

The tests start the API in-process on `TEST_API_PORT` from `.env` (5607 without `.env`), so they
run alongside the dev env and other worktrees. `npm run quality` runs the whole gate (lint, types,
tests, audit); the pre-push hook runs it.
