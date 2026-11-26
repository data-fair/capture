# Contribution guidelines

## Prerequisites

- Node.js, the version of `.nvmrc`
- gifsicle (animated captures), installed on your system. The browser is chrome-headless-shell:
  the image installs Debian's package, development and tests use the build downloaded by puppeteer
  (`npm run dev-setup` installs the version that matches puppeteer)

## Setup

No containers: in development capture runs without authentication (no `privateDirectoryUrl`).
`dev/default.env` holds fixed default ports (block 6100-6149), copied to `.env` when there is none
(`.env` is never overwritten, edit it to change a port).

1. Install dependencies (without the full Chrome of puppeteer's postinstall, not used):
   ```bash
   PUPPETEER_SKIP_DOWNLOAD=true npm ci
   ```

2. Start the api (writes `.env`, installs chrome-headless-shell and builds the types when needed):
   ```bash
   npm run dev
   ```
   It prints the URL of a test screenshot. nodemon reloads the api on file changes. The steps
   also run alone: `npm run dev-deps` (`.env`), `npm run dev-setup` (types, browser) and
   `npm run dev:api` (the api).

## Tests

    npm test
    npm run test-base test-it/capture.ts

The tests start the API in-process on `TEST_API_PORT` from `.env` (6101 without `.env`), so they
run alongside the dev api. `npm run quality` runs the whole gate (lint, types,
tests, audit); the pre-push hook runs it.
