# capture benchmark

A local harness to test performance hypotheses about capture: the wait strategy, the browser
binary and its flags, the output encoders, the GIF pipeline, the concurrency. Findings and
recommendations are in [FINDINGS.md](./FINDINGS.md).

No dev environment needed. The harness starts its own fixtures server (pages served with
artificial latency, no internet) and its own browsers. Only `e2e` starts the service itself, as a
child process.

```bash
npm run benchmark                          # list the experiments
npm run benchmark -- wait --runs=8         # one experiment
npm run benchmark -- all --runs=8          # everything, ~1 hour
npm run benchmark -- concurrency --browser=shell
```

`--browser` picks the binary for single-browser experiments:
- `chrome-stable`, the default, is what the Docker image installs (`/usr/bin/google-chrome-stable`);
- `cft` and `shell` are the Chrome for Testing and chrome-headless-shell builds in
  `~/.cache/puppeteer`. Install them with `npx puppeteer browsers install chrome-headless-shell`.

On Ubuntu ≥ 23.10, AppArmor blocks the Chrome sandbox for binaries that have no AppArmor profile.
Only the google-chrome-stable deb installs one. So `cft` and `shell` run with `--no-sandbox`, and
`chrome-stable-nosandbox` gives the like-for-like comparison.

## Experiments

| name | question |
|---|---|
| `wait` | latency, and share of complete renders, for each wait strategy after navigation |
| `browser` | chrome-stable vs Chrome for Testing vs chrome-headless-shell: launch, latency, CPU, memory |
| `context` | pooled context vs fresh context vs reused page, and the cost of each page setup call |
| `console` | cost of the console listener that `debugPage` always attaches |
| `output` | screenshot formats (png, png `optimizeForSpeed`, jpeg, webp) and PDF options (tagged, outline, footer) |
| `gif` | per-stage cost of the animated GIF pipeline, and how long it blocks the event loop |
| `concurrency` | throughput, latency, CPU and memory for 1 to 20 concurrent captures, with 1 or 2 browsers |
| `args` | chrome launch flags: CPU, memory and process count at concurrency 5 |
| `transport` | websocket vs pipe CDP transport, on large outputs |
| `e2e` | the real service over HTTP: timer steps under load, event loop blocking during a GIF, overload with abandoned requests |
| `hotspot` | CPU by chrome process type under paint-heavy load, to find what caps a single browser |
| `real` | the wait strategies on the public applications of a data-fair instance, pixel-compared to a settled reference |

`e2e` options, as environment variables:
- `BENCH_E2E_DIR`: run the service from another checkout, for example a worktree of master, to
  A/B two versions of the code;
- `BENCH_E2E_CONFIG`: JSON merged into the service config, for example
  `{"puppeteerLaunchOptions":{"headless":"shell","executablePath":"..."}}`.

`real` options: `BENCH_REAL_URL` (default `https://opendata.koumoul.com/data-fair`) and
`BENCH_REAL_APPS` (comma separated ids; default: up to 2 applications per base application).
It captures one page at a time, to stay gentle with the instance. Suspect captures and their
reference are written to `results/real/`.

`wait` option: `BENCH_WAIT_PAGES` (comma separated page names) for a subset.

`gif` option: `BENCH_SHARP` is the path of a sharp install
(`npm i sharp` in a scratch directory, then point to `node_modules/sharp/dist/index.cjs`).
It adds a variant that encodes with libvips, cgif and libimagequant. sharp is not a dependency
of the service.

## Method

- Variants are interleaved (A B C, B C A, …), so that drift in the machine's load hits all
  variants alike. One warmup iteration per variant is discarded.
- Each cell shows the median, then `[min-max]`, then the ratio to the first row. `LOWER` and
  `HIGHER` flag a difference only when the min–max ranges do not overlap and the medians differ by
  more than 10%. This is the rule of the data-fair harness.
- Browser CPU is the CPU time of the browser process tree, read from `/proc` (Linux only). Child
  processes that already exited are counted through their parent's cumulated fields. Memory is the
  PSS of the tree, which does not count shared pages twice the way a sum of RSS would.
- `lib/capture.ts` copies the page lifecycle of `api/utils/page.ts`, with each lever turned
  into a parameter. It is kept in sync by hand. `e2e` is the check against the real code.
- Results are printed as markdown tables and saved as JSON in `results/` (git-ignored), tagged
  with the commit.
- The dev machine is shared and loaded. Trust the ratios more than the absolute values.
