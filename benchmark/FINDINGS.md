# capture performance investigation, 2026-11

Scope: how the service orchestrates captures, how it drives the browser through puppeteer, which
browser it embeds, and the alternatives at each of these levels. Every claim marked
**measured** comes from an experiment of this harness (`npm run benchmark -- <name>`, see
[README.md](./README.md)). Claims marked **code** come from reading the code. Claims marked
**not measured** are reasoned but untested.

Machine: 16 cores, 31 GB of RAM, a shared desktop under load (other apps running). Browsers:
google-chrome-stable 150 (the one the Docker image installs), Chrome for Testing 156 and
chrome-headless-shell 156. Treat absolute numbers as indicative and trust the ratios. The
tables below are from the 8-run pass. Raw JSON is in `results/` (git-ignored).

## Status (2026-11-09)

- **Done on this branch**: the wait strategy (§1, network idle then visual quiet, capped), a
  `capture-no-trigger` warning for pages that do not call `window.triggerCapture`, the PNG
  fast encoding above `pngFastEncodingPixels` and for full-page captures (§2), and the fixes of
  `type=jpg` (PNG bytes labelled `image/jpeg`) and of `type=gif` on a page without
  animation (PNG bytes labelled `image/gif`).
- **Done too**: the debug listeners only when `DEBUG` is set (§6); abandoned captures skipped
  and the contexts queue bounded (`config.queue`, §7); the GIF encoding in piscina worker
  threads (`config.gifThreads`, §5). Event loop probe during a GIF: p90 83 → 1.2 ms, max
  131 → 4.6 ms. chrome-headless-shell (§3): Debian's `chromium-headless-shell` in the image,
  puppeteer's download in development, tests and CI. Image 1.12 GB → 904 MB, container memory
  324 → 142 MiB idle and ~780 → ~550 MiB under 10 concurrent captures. It runs sandboxed with
  `seccomp.json` (renderers in their own user namespace). Its version comes from Debian's
  security updates, not from puppeteer: puppeteer 25.16 expects 156, trixie ships 156.0.8078.79.
  Keep the two close when upgrading puppeteer.
- **Concurrency review (2026-11-09)**: the contexts pool reused incognito contexts across
  captures and only deleted cookies, so localStorage, IndexedDB and Cache Storage of one capture
  were visible to the next one, whatever its user (shown by a test on master). Each capture now
  runs in a fresh incognito context, closed after it (+3 ms). generic-pool is replaced by the
  service's own semaphore, with a bounded queue, a wait timeout (30 s, below data-fair's 60 s)
  and abort while waiting. `/inspect` uses the same mechanism. Infrastructure side: the
  production pod runs at its 1.5 GiB limit at concurrency 3 on the real mix and uses >5 cores with
  no CPU request. Concurrency 2 is planned.
- **Declined**: untagged PDFs (§4). Accessibility comes first.

## Steady load on real applications (2026-11-09)

The two images (master vs this branch), `CONCURRENCY=5`, 8 clients looping for 60 s over the 66
public applications of opendata.koumoul.com (52 call `triggerCapture`), 1050×450, 2 runs per
image in alternating order, a fresh container each run:

| | master | this branch |
|---|---|---|
| captures per minute | 145, 160 | **163, 170** (+~10%) |
| p50 latency, apps with triggerCapture | 2221, 1965 ms | 1930, 1904 ms |
| p50 latency, apps without | 4154, 3615 ms | **2646, 2627 ms** (−30%) |
| CPU per capture (container) | 2966, 2841 ms | 2900, 3004 ms |
| cores busy | 7.2, 7.6 | 7.9, 8.5 |
| memory peak (cgroup) | 2815, 2927 MB | 2873, 2858 MB |

**The instance is CPU-bound on real applications, and the CPU goes to WebGL maps.** Measured app
by app (browser process tree, sequential): 3.4 s of CPU per capture on average. 21 of the 66
applications use WebGL (maplibre maps: admin-divs-levels, data-fair-geo-shapes, carto-stats,
admin-divs-catchment, infos-parcelles, infos-loc, carto-explore, atelier-carto...), and they take
**90% of the CPU**, 5-18 s each. Without a GPU, Chrome renders WebGL in software (SwiftShader).
The other 45 applications average ~0.5 s. Consequences:
- the shorter waits mostly cut latency. Throughput only gains ~10%, because the CPU is the limit;
- the browser savings of chrome-headless-shell (~100 ms of CPU per light capture) are a few
  percent of a real mix. Its memory gain shows at idle, not at the peak, which is set by the
  renderers of heavy pages;
- **the next lever is the WebGL maps**: a capture mode in the map applications (no
  transitions or fly-to, `fadeDuration: 0`, `triggerCapture` on the map's `idle` event), or
  measuring Chrome's other software GL backends.

## TL;DR

Where a capture's time goes today, for a typical data-fair page that does not call
`triggerCapture`:

```
newPage+setup  ~35-90 ms   (negligible)
networkidle0   1000-2100 ms  <- Chrome's idleness detector, not 500 ms
fixed sleep    1000 ms       <- "for safety"
screenshot     30-330 ms     (PNG encoded on the browser's main thread)
```

Ranked by gain for effort:

| # | change | gain (measured) | cost / risk |
|---|---|---|---|
| 1 | replace `networkidle0` + 1 s with puppeteer's `waitForNetworkIdle` + 2 animation frames (+ a configurable short settle) | static page 2.0 s → 0.52 s, app page 3.1 s → 1.1 s; a context is held ~2 s less, so ~2× throughput at the same concurrency on I/O-bound pages | pages that render >0.5 s after their last response without any network activity are captured too early. Today they are only caught by accident (see §1). A product decision |
| 2 | `optimizeForSpeed: true` on PNG screenshots | encoding ×2.5 faster, browser CPU −60%; under CPU-bound concurrency **+40% throughput, −32% p50** (PNG encoding serializes on the browser's main thread) | files 1.1-1.9× bigger |
| 3 | switch to **chrome-headless-shell** (Debian `chromium-headless-shell`) | idle memory −51% (145 vs 296 MB), launch 39 vs 155 ms, browser CPU −20 to −43% per capture (PDF ×1.6 faster), +30% CPU-bound throughput; multi-arch (arm64), 230 MB installed vs 416 MB, security updates through apt | a different build (Chromium, not Google Chrome). Needs the test suite and a visual check of real pages |
| 4 | ~~PDF `tagged: false` (puppeteer defaults to `true`)~~ declined | PDF ×2 faster, files **÷9** (1.2 MB → 137 KB for 30 sections) | tagged PDF is what makes a PDF accessible (screen readers, RGAA). A product decision: maybe opt-in per request |
| 5 | move the GIF encoding off the main thread (worker thread, or sharp/libvips) | today a 30-frame GIF burns ~4.3 s of main-thread CPU and stalls every other request (probe p90 83 ms, max 131 ms) | small code change. sharp would be a new native dependency |
| 6 | attach the `console` listener only when `DEBUG` is set | node CPU ÷4 on a page logging 500 messages | none |
| 7 | drop queued work whose client left; bound the queue | after 30 abandoned requests, a 0.7 s capture answered in **18 s** (§7) | small |

Not worth it (measured): launch flags (none helps, the commented-out swiftshader option costs
×3.7 CPU), websocket vs pipe CDP transport (no difference), a fresh context vs the pool (no
difference), the sandbox (no measurable cost). Not worth it (reasoned): Playwright (same engine,
same CDP), Lightpanda (no rendering engine, so no screenshots or PDFs), Firefox through BiDi.

## 1. The wait strategy: most of the latency

**code**: `waitForPage` (`api/utils/page.ts`) runs `page.goto(target, { waitUntil: 'networkidle0' })`
raced against `window.triggerCapture`. Then it looks up 2 metas, and when neither is set it
sleeps 1000 ms "for safety".

**measured** (`wait`): `networkidle0` is not "500 ms without requests". It maps to Chrome's own
`networkIdle` lifecycle event, fired by Blink's `IdlenessDetector`. That detector only checks for
quiet when a main-thread task runs or when its watchdog timer fires. It also pushes the quiet
window forward by the time spent in tasks. So the event lands well after the nominal 500 ms, at a
moment that depends on page activity:

Median wait in ms (8 runs), and the share of captures where the page had finished rendering:

| page | current | idle0 (no +1s) | idle0-300 | idle200-raf | **idle500-raf** | idle2 |
|---|---|---|---|---|---|---|
| static (no sub-resource) | 2014, 8/8 | 1012, 8/8 | 1313, 8/8 | 223, 8/8 | **524, 8/8** | 2013, 8/8 |
| app (3 API calls of 150 ms) | 3114, 8/8 | 2113, 8/8 | 2413, 8/8 | 781, 8/8 | **1080, 8/8** | 1669, 8/8 |
| app, render 300 ms after the last response | 3115, 8/8 | 2112, 8/8 | 2413, 8/8 | 780, **0/8** | **1078, 8/8** | 1669, 8/8 |
| app, render 800 ms after the last response | 2381, 8/8 | 1377, 8/8 | 1678, 8/8 | 782, **0/8** | **1075, 0/8** | 1670, 8/8 |
| app, API calls of 400 ms | 3113, 8/8 | 2109, 8/8 | 2414, 8/8 | 1533, 8/8 | **1830, 8/8** | 1914, 8/8 |
| app calling triggerCapture | 572 | 573 | 573 | 571 | 574 | 574 |

Oddity that shows the detector is not a network timer: the page that renders 800 ms late reaches
`networkidle0` *sooner* (1377 ms) than the one that renders 300 ms late (2112 ms).

Reading:
- the floor of the service is **2 s on a static page with no sub-resource**. `idle500-raf`
  (puppeteer-side `waitForNetworkIdle({ idleTime: 500 })` after `load`, then 2 animation frames)
  does the same page in ~0.55 s;
- on the app page (data rendered ~0.55 s after navigation), the service answers in 2.7-3.1 s.
  `idle500-raf` answers in ~1.1 s and the render is complete;
- `late300`/`late800` render 300/800 ms after their last response, with no network in between.
  The current strategy catches them through Chrome's detector delay plus the 1 s. The fast
  strategies miss renders later than their idle window. **This is the real trade-off.** Today's
  margin is accidental and unbounded (up to 2+ s). A deliberate margin would be a config value,
  e.g. `idleTime` 500 ms plus a configurable settle, with the existing `df:capture-delay` meta
  and `triggerCapture` for pages that need more;
- `networkidle2` is not a fix: it fires earlier, but the 1 s sleep remains.

**measured** (`e2e`, the real service): app page at concurrency 5, the service's own timer steps:
`wait1-network-idle` 2110 ms + `wait2-1s` 1000 ms out of a 3.2 s total; with `triggerCapture`
the total is 0.69 s.

### Synthetic risks after the last response (`wait`, fixtures/settle.html, 4 runs)

| page | current | idle500-raf | idle500-500 | **quiet** (idle 500 ms, then 200 ms of visual quiet, cap 2 s) |
|---|---|---|---|---|
| canvas chart animated 1 s by requestAnimationFrame | 1699 ms, 4/4 | 692, 0/4 | 1169, 0/4 | **1421, 4/4** |
| canvas chart animated 2.5 s | 1694, **0/4** | 690, 0/4 | 1170, 0/4 | 2676 (cap), 3/4 |
| CSS transition 1 s | 1695, 4/4 | 691, 0/4 | 1171, 1/4 | **1424, 4/4** |
| endless spinner next to the content | 1676, 4/4 | 688, 4/4 | 1170, 4/4 | **672, 4/4** (endless animations ignored) |
| web font loaded late | 3009, 4/4 | 1289, 4/4 | 1782, 4/4 | **1281, 4/4** |
| content inserted by a 800 ms setTimeout | 1971, 4/4 | 684, 0/4 | 1170, 4/4 | 671, **0/4** |

`quiet` is faster than today and safer on animations: an animation longer than today's
accidental margin is captured half-drawn today. Its blind spot is a render delayed by a plain
timer after a quiet period. The `capture-no-trigger` warning exists for that: such pages should
call `triggerCapture`.

### Real pages (`real`: the 66 public applications of opendata.koumoul.com, 1050×450)

Each capture is compared to a reference, today's strategy + 3 s, and to a second reference that
measures the page's own noise.
- 54 of 66 applications call `triggerCapture` (app-charts, app-dashboards, maps, catalog...):
  the strategy barely changes them.
- the 12 without any signal: app-timelines, list-details, periodic-series, data-fair-quizz,
  data-fair-locate-game, data-fair-sort-game, app-carousel. `quiet` takes 1.0-1.3 s vs 2.0-2.3 s,
  with no difference to the reference, except:
  - app-carousel rotates its slides, so every strategy differs from the reference (noise 90%);
  - one list-details app has a map whose tiles load and decode in web workers, invisible to
    every page-level signal. Today's capture is half-loaded too (5.5% off the reference),
    `quiet` captures the map empty (25%). The fix belongs in the application: call
    `triggerCapture` on the map's `idle` event;
- a semantic signal was tried and rejected: waiting while a visible `role=progressbar` is present.
  The same list-details page shows 19 Vuetify progress bars that are value bars, not loaders.

**A/B of the real service** (this branch vs master, 2 interleaved captures per application and
side, public applications):

| | master | this branch | pixel diff |
|---|---|---|---|
| 9 applications without triggerCapture, median | 2093 ms | **1075 ms** | 0% on all |
| 5 applications with triggerCapture, median | 1345 ms | 1334 ms | 0% on all |

### Throughput

Since a capture holds its browser context while it waits, the wait also caps throughput:
`concurrency` captures every ~3.2 s = 1.5/s at the default concurrency of 5 (**measured**).

## 2. Screenshot encoding, and the single-browser ceiling

**measured** (`output`):

| page | png (today) | png `optimizeForSpeed` | jpeg q80 | webp q80 |
|---|---|---|---|---|
| app 800×450 | 25 ms, 44 KB | 23 ms, 83 KB | 23 ms, 40 KB | 43 ms, 14 KB |
| heavy 1920×1080 | 302 ms, 2.5 MB | **113 ms**, 2.7 MB | **52 ms**, 675 KB | 232 ms, 570 KB |
| long page, full height at 1280 | 552 ms, 1.8 MB | **267 ms**, 2.7 MB | 306 ms, 2.8 MB | 1110 ms, 1.6 MB |

On small viewports encoding is negligible. It matters for large viewports and full-page
captures (`height=auto`).

**measured** (`concurrency`, `hotspot`): on a paint-heavy page, one browser stops scaling at about
2 cores, whatever the concurrency (c10 and c20 give the same throughput). Splitting c10 over 2
browsers gives +40% throughput and −30% p50. The CPU split by process and by thread shows the
serial bottleneck: the **browser process main thread** (`CrBrowserMain`) at ~0.7-0.85 of a
core. Renderers use ~0.7 cores in total, the GPU process 0.1. `Page.captureScreenshot` encodes
the image in the browser process. Proof: on the same browser at c10, `optimizeForSpeed` gives
5.6/s vs 4.0/s (+40%), and jpeg-80 gives 6.2/s (+55%).

| load | c1 | c2 | c5 (default) | c10 | c20 | c10 over 2 browsers |
|---|---|---|---|---|---|---|
| app, current wait (I/O-bound): captures/s | 0.3 | 0.6 | 1.5 | 2.7 | 4.6 | 2.8 |
| p50 | 3.2 s | 3.3 s | 3.4 s | 3.5 s | 3.7 s | 3.5 s |
| cores used / peak PSS | 0.1 / 320 MB | 0.2 / 351 | 0.4 / 443 | 0.9 / 623 | 1.3 / 942 | 0.8 / 855 |
| heavy 1280×800 (CPU-bound): captures/s | 0.8 | 1.4 | 2.9 | 3.9 | **3.9** | **5.3** |
| p50 | 1.25 s | 1.42 s | 1.52 s | 2.35 s | 4.98 s | 1.58 s |
| cores used / peak PSS | 0.3 / 423 MB | 0.7 / 500 | 1.4 / 720 | 2.1 / 1097 | 2.1 / 1860 | 2.9 / 1339 |

`hotspot` (heavy, c10): browser process 0.8-0.9 core (its main thread alone ~0.7), renderers
0.7 cores in total, GPU process 0.1. With chrome-headless-shell: 4.9/s, p50 1.74 s.

Consequences:
- for light pages, the service is I/O-bound (waiting): throughput scales linearly with
  concurrency, at ~25-30 MB of PSS per extra concurrent page. The default concurrency of 5 uses
  0.4 core. With a shorter wait (§1), the same concurrency gives ~2× the throughput;
- for heavy pages, scale with more browsers (more pods, or N browsers per pod with the contexts
  pool sharded), not with more contexts in one browser;
- `optimizeForSpeed` raises the ceiling of a browser by ~40%. The bigger files matter for
  thumbnails that are stored; jpeg/webp could be an option for callers that accept it. Beware, **code**:
  `type=jpeg` does not work today. The router sets the response type but calls
  `page.screenshot()` without `type`, so it returns PNG bytes labelled `image/jpeg`.

## 3. The browser binary

**measured** (`browser`):

| | chrome-stable 150 (today) | same, --no-sandbox | Chrome for Testing 156 | **chrome-headless-shell 156** |
|---|---|---|---|---|
| launch | 155 ms | 147 ms | 141 ms | **39 ms** |
| idle memory (PSS) | 296 MB | 299 MB | 269 MB | **145 MB** |
| processes | 11 | 10 | 8 | 6 |
| app png: total / browser CPU | 639 ms / 240 ms | 637 / 230 | 651 / 230 | 637 / **150** |
| heavy 1920×1080 png: total / CPU | 1372 / 660 | 1372 / 670 | 1373 / 700 | 1337 / **535** |
| long PDF: pdf() time / CPU | 267 / 595 | 267 / 600 | 291 / 625 | **169** / **340** |
| memory after the captures | 266 MB | 266 MB | 662 MB | **149 MB** |

Under CPU-bound concurrency (c10, heavy page, `hotspot`): 5.0-5.1/s with the shell vs 3.8/s,
p50 1.6 s vs 2.2-2.3 s.

- **chrome-headless-shell** is the "old headless" Chromium, shipped as a separate binary since
  Chrome 132 removed old headless from the main binary. It has no browser UI layer. It uses half
  the memory at idle, 15-45% less browser CPU per capture, and handles ~30% more throughput when
  CPU-bound (**measured**, `hotspot`). Page latency is the same, because the waits dominate;
- the 150 → 156 version change (chrome-stable vs CfT) explains little. The headless mode
  (CfT 156 vs shell 156) explains most of the difference;
- the sandbox has no measurable cost (chrome-stable vs chrome-stable-nosandbox);
- packaging: Debian trixie (the base of the image) ships `chromium-headless-shell` 156 for amd64
  and arm64, 230 MB installed vs 416 MB for `/opt/google/chrome`, with fewer dependencies (no
  GTK, cups…), and updates through the same `apt-get upgrade` as the rest of the image. The
  current Dockerfile pins the Google repo to `arch=amd64` while it handles arm64 for dumb-init,
  so an arm64 image has no browser today. Puppeteer drives it with `headless: 'shell'`;
- risks (**not measured**): Chromium is not Google Chrome (no proprietary codecs, which do not
  matter for captures), and old headless has small behavioural differences. The test suite and
  a visual diff of a sample of real data-fair pages should gate the switch;
- alternatives:
  - **Playwright**: same Chromium, same CDP, and its default headless is already the headless
    shell. No performance gain to expect over puppeteer + shell. The setup calls measured below
    cost < 1 ms each, so the driver is not a cost;
  - **Lightpanda**: a fast headless browser without a rendering engine. It cannot produce
    screenshots or PDFs (placeholder images per its docs), so it is out of scope;
  - **Firefox through WebDriver BiDi** (puppeteer supports it): a different rendering of the
    same pages, no known performance advantage. Not measured;
  - dedicated PDF engines (WeasyPrint, Gotenberg): Gotenberg is Chromium too. WeasyPrint does not
    run JavaScript, and data-fair pages are JS applications. Out of scope.

## 4. PDF

**measured** (`output`):

| document | default (tagged) | `tagged: false` | `outline: true` | footer template |
|---|---|---|---|---|
| 30 sections (~40 pages) | 245 ms, 1222 KB | **119 ms, 137 KB** | 251 ms, 1247 KB | 282 ms, 1233 KB |
| 120 sections | 1026 ms, 4.9 MB | **422 ms, 489 KB** | 1064 ms, 5.0 MB | 1169 ms, 4.9 MB |

Puppeteer defaults to `tagged: true` and also launches Chrome with `--export-tagged-pdf`.
Tagging builds the accessibility structure of the document. It doubles the PDF time and makes
the file ~9× bigger. `outline` costs nothing. The footer template costs +10-15%.

## 5. Animated GIF

**code**: `api/utils/animation.ts` takes a PNG screenshot per frame, decodes it in pure JS
(get-pixels/pngjs), quantizes and encodes it in pure JS (gif-encoder, NeuQuant), then runs
gifsicle. All of it runs on the service's main thread.

**measured** (`gif`, 800×450, 30 frames):

| variant | total | screenshots | JS decode | JS encode | gifsicle | node CPU | max event loop stall | size |
|---|---|---|---|---|---|---|---|---|
| today (png `optimizeForSpeed`, get-pixels, gif-encoder) | 4.5 s | 1.43 s | 0.37 s | **2.44 s** | 0.26 s | **4.2 s** | **138 ms** | 3.4 MB |
| jpeg-90 frames | 4.4 s | 1.03 s | 0.38 s | 2.72 s | 0.27 s | 4.0 s | 169 ms | 3.3 MB |
| sharp, default options | 7.1 s | 1.76 s | - | 5.03 s (libvips threads) | 0.28 s | 5.2 s (threads) | **12 ms** | 3.7 MB |

**measured** (`e2e`): during one GIF capture, a probe requesting `api-docs.json` every 20 ms sees
p50 1 ms but p90 83 ms and max 131 ms. Every request of the service (other captures, metrics,
health checks) stalls for the length of a frame encoding.

- the browser side is ~1/3 of the time. Node-side decode + quantize + encode is ~2/3, all on
  the main thread;
- jpeg frames do not help: a cheaper screenshot, but a slower JS decode;
- sharp (libvips + libimagequant + cgif) with `effort: 1, dither: 0` uses about the same CPU
  as today (2.3 s vs 3.0 s for 30 frames, **measured** on saved frames), but in libuv threads.
  The event loop stays free (max stall 13 ms vs 139 ms). Its defaults (effort 7, dithering) are
  2× slower than today;
- the cheapest fix with no new dependency is to run the existing decode + encode in a
  `worker_thread`. A semaphore like the one of `/inspect` should bound the concurrent GIFs:
  each one burns a full core for seconds;
- an animated WebP (sharp, q80) takes ~0.5 s and 359 KB vs ~4.7 s and 3.4 MB for the GIF. That
  could be an option for clients that accept it;
- **code**: `maxAnimationFrames` is 1800 ("2 minutes at 15 fps"), but the callback of an
  animated capture has a `screenshotTimeout * 2` = 40 s budget. At ~160 ms per 800×450 frame,
  that budget allows ~250 frames (~17 s of animation). Larger viewports allow fewer.

## 6. Plumbing: contexts, pages, setup calls, console, transport

**measured** (`context`): `newPage` ~30 ms, each setup call (`emulateTimezone`,
`setExtraHTTPHeaders`, `evaluateOnNewDocument`, `exposeFunction`, `setViewport`, request
interception) < 1 ms, the meta lookups ~4 ms, cleanup ~2.5 ms. A fresh incognito context per
capture costs the same as the pool. The pool is fine, and so is the per-capture setup.

**measured** (`console`): `debugPage` attaches a `console` listener on every page, even when
`DEBUG` is off. The listener does 2 CDP round trips per argument of every message. On a page
logging 500 messages: node CPU 167 ms → 40 ms without it. Latency barely moves, because the work
lands after the response, but the CPU is paid on the service's main thread. Fix: attach it only
when `debug.enabled`.

**measured** (`transport`): websocket vs `pipe: true`, on a 1920×3000 PNG and an 800 KB PDF: no
difference.

**measured** (`args`): `--disable-gpu`, no site isolation, `--renderer-process-limit=2`,
disabling background features: within noise for throughput. No site isolation or `--renderer-process-limit=2` save
10-18% of browser CPU (fewer renderer processes). That is not worth giving up process isolation
in a service that renders arbitrary pages. The
commented-out option of `config/default.cjs` (`--use-angle=swiftshader --in-process-gpu`) costs
**×3.7 CPU**: remove it, so nobody enables it.

## 7. Orchestration under load

**code**, `api/utils/page.ts`:
- the contexts pool (`generic-pool`) has no `maxWaitingClients` and no `acquireTimeoutMillis`.
  Under overload the queue is unbounded. The capture timeouts only start after the acquisition,
  so a queued request can wait indefinitely;
- `/screenshot` and `/print` never check whether their client is still there. `/inspect` does
  (`req.socket.destroyed` before rendering). A request abandoned by a proxy timeout (60 s) or by a
  user still gets rendered for nobody when its turn comes, and delays the requests behind it.
  **measured** (`e2e`, overload scenario): 30 clients give up after 2 s, then one client asks for a page
that takes 0.7 s alone. It gets its answer after **18.0 s**, because the service first renders the
abandoned requests for nobody (concurrency 5, ~3.2 s each);
- `promiseTimeout` never clears its timer: each capture leaves 2 pending timers of 20-40 s. Minor;
- **not measured**: one browser process lives as long as the pod. Chrome's memory tends to grow
  over long uptimes, and nothing recycles it except a crash. A restart after N captures or above
  a memory threshold (drain the pool, launch a new browser, close the old one) would bound it.

Suggested shape: check `req.socket.destroyed` before and after the acquisition in `withPage`,
and abort the render when the client closes (`res.on('close')`). Bound the queue
(`maxWaitingClients`, then a 503 that the proxy or client can retry), and give the acquisition a
timeout.

## 8. Applications to fix

The `capture-no-trigger` warning (`code: capture-no-trigger`, with the target and what settled the
capture) lists them in production. From the public sample: app-timelines, list-details (on the
map's `idle` event), periodic-series, data-fair-quizz, data-fair-locate-game,
data-fair-sort-game, app-carousel, and infos-territoires (it relies on its `df:capture-delay`
meta, 2 s, without calling `triggerCapture`).

## 9. Suggested order of work (initial)

1. Low risk, no product decision: console listener behind `debug.enabled`; `optimizeForSpeed`
   on PNG screenshots (if bigger files are acceptable); skip abandoned requests and bound the
   queue; GIF encoding in a worker thread plus a GIF semaphore; remove the swiftshader comment.
2. Wait strategy: decide the safety margin (§1), then implement it behind config, A/B it with
   `e2e` (`BENCH_E2E_DIR` = a master worktree), and check real data-fair applications.
3. Browser: build an image on `chromium-headless-shell`, run the tests, diff screenshots of real
   pages, then roll it out. Revisit `concurrency` per pod with the memory figures above.
4. PDF tagging: product decision (accessibility vs size/time), maybe a `tagged` query parameter.
