# AGENTS.md

## Project overview

Capture renders Web pages with puppeteer (chrome-headless-shell) and returns screenshots (png, jpg,
animated gif through gifsicle) or prints (pdf, html). API routes in `api/routers/capture.ts`,
browser and capture slots in `api/utils/page.ts` (one fresh incognito context per capture), config
in `config/` (types generated in `config/type/` by `npm run build-types`).

Node.js v24, TypeScript run directly by Node's type stripping (no build step, erasable syntax
only), Express 5.

## Dev environment

A minimal dev path, no extra tooling and no containers (in development capture runs without
authentication: no `privateDirectoryUrl`):

```bash
npm run dev          # .env from dev/default.env when absent, dev-setup, then the api
npm run dev-deps     # only writes .env from dev/default.env when absent
npm run dev-setup    # generated types and puppeteer's chrome-headless-shell, idempotent
npm run dev:api      # the api alone (nodemon), on DEV_API_PORT (6100 by default)
```

- `dev/default.env` holds the fixed default ports (block 6100-6149): `DEV_API_PORT` for the dev
  api, `TEST_API_PORT` for the tests. `.env` overrides it and is never overwritten.
- The dev config reads its values through the production env names (`PORT`, `PUBLIC_URL`,
  `ONLY_SAME_HOST`, `SECRET_INSPECT`...): an environment that runs the api sets them over it.
- nodemon already reloads the api on file changes.

## Testing

`node:test` suites in `test-it/`, they start the API in-process on `TEST_API_PORT` (read from
`.env`, 6101 without it) and need gifsicle on the machine and puppeteer's chrome-headless-shell
(`npm run dev-setup`).

```bash
npm test                                   # all tests
npm run test-base test-it/capture.ts       # one file
```

When iterating, run only the related file. The pre-push hook runs `npm run quality` (lint,
build-types, check-types, tests, audit).

`make animated gif screenshot of a page` flakes on a loaded machine (check `/proc/loadavg` before
calling it a regression): its 16 frames (`test-it/resources/test-anim.html`) must fit in
`screenshotTimeout * 2` (`api/utils/page.ts`), 4 s with the test config. Do not raise
`screenshotTimeout` in `config/test.cjs`: `make prints of a page that is never idle` asserts a
count reached inside that ~2 s window. Lower the frame count or give animations their own budget.

## Linting & type checking

```bash
npm run lint        # eslint (neostandard + @data-fair/lib-utils rules)
npm run lint-fix
npm run check-types # tsc
```
