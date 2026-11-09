# AGENTS.md

## Project overview

Capture renders Web pages with puppeteer (chrome-headless-shell) and returns screenshots (png, jpg,
animated gif through gifsicle) or prints (pdf, html). API routes in `api/routers/capture.ts`,
browser contexts pool in `api/utils/page.ts`, config in `config/` (types generated in
`config/type/` by `npm run build-types`).

Node.js v24, TypeScript run directly by Node's type stripping (no build step, erasable syntax
only), Express 5.

## Dev environment

The user starts the dev environment of a checkout with `npm run dev-zellij` (zellij >= 0.44,
session named after the checkout directory). Agents never start or kill the session, and act on
processes only through `df-dev`:

```bash
npx --no df-dev status                # panes (running / exited + code, readiness), dev processes memory
npx --no df-dev logs api -n 100       # last lines of a pane: api, status
npx --no df-dev restart api           # Ctrl+C, rerun, then wait for /api/v1/api-docs.json
```

- Read the logs before restarting: nodemon already reloads the api on file changes. Restart only a
  pane that exited, hangs, or needs new env.
- If `restart` answers "not ready", report to the user with the logs instead of retrying.
- Never use `kill`, `zellij action`, nor `npm ci` / `npm install` while the env runs.
- Always `npx --no`: a bare `npx df-dev` would download an unrelated public package.
- No containers: in development capture runs without authentication.

Each git worktree gets its own `.env` (ports drawn by `npx --no df-dev setup`, do not edit them by
hand). From the main checkout:

```bash
npx --no df-worktree feat-xyz          # ../capture_feat-xyz: npm ci + df-dev setup (.env, types)
npx --no df-worktree-delete feat-xyz   # zellij session, then the worktree
```

Branch names: letters, digits, `.`, `_`, `-`, no `/`, and `capture_<branch>` at most 60 characters.

## Testing

`node:test` suites in `test-it/`, they start the API in-process on `TEST_API_PORT` (`.env`) and
need gifsicle on the machine and puppeteer's chrome-headless-shell
(`npx puppeteer browsers install chrome-headless-shell`).

```bash
npm test                                   # all tests
npm run test-base test-it/capture.ts       # one file
```

When iterating, run only the related file. The pre-push hook runs `npm run quality` (lint,
build-types, check-types, tests, audit).

## Linting & type checking

```bash
npm run lint        # eslint (neostandard + @data-fair/lib-utils rules)
npm run lint-fix
npm run check-types # tsc
```
