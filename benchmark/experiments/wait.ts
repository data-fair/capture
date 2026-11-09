import { withEnv, type Experiment } from './common.ts'
import { setupPage, gotoAndWait, cleanPage, createContextPool, type WaitStrategy } from '../lib/capture.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'

// H: on pages that do not call triggerCapture, the latency floor is the networkidle0 window (500ms
// of no request) plus a fixed 1s. The 1s is a safety margin for rendering after the last response;
// the question is how much of it is needed, measured by the share of captures taken before the page
// declared itself done (data-done), with renders that land 0, 300 and 800ms after the last response.

const strategies: WaitStrategy[] = ['current', 'idle0', 'idle0-raf', 'idle0-300', 'idle200-raf', 'idle500-raf', 'idle500-500', 'quiet', 'idle2']
// BENCH_WAIT_PAGES: comma separated subset of the pages below
const allPages: Record<string, string> = {
  static: '/fixtures/static.html',
  app: '/fixtures/app.html',
  'app-late300': '/fixtures/app.html?late=300',
  'app-late800': '/fixtures/app.html?late=800',
  // a slower backend: 400ms per API call
  'app-slow-api': '/fixtures/app.html?apiDelay=400',
  'app-trigger': '/fixtures/app.html?trigger=1',
  // what may happen after the last response (fixtures/settle.html)
  'raf chart 1s': '/fixtures/settle.html?mode=raf&ms=1000',
  'raf chart 2.5s': '/fixtures/settle.html?mode=raf&ms=2500',
  'css transition 1s': '/fixtures/settle.html?mode=css&ms=1000',
  spinner: '/fixtures/settle.html?mode=spinner',
  'font 600ms': '/fixtures/settle.html?mode=font&ms=600',
  'timer 800ms': '/fixtures/settle.html?mode=timer&ms=800'
}

const pages = process.env.BENCH_WAIT_PAGES
  ? Object.fromEntries(Object.entries(allPages).filter(([k]) => process.env.BENCH_WAIT_PAGES!.split(',').includes(k)))
  : allPages

export const wait: Experiment = {
  description: 'latency and completeness of the wait strategies after navigation',
  async run (opts) {
    await withEnv(opts, async ({ url, l }) => {
      const pool = createContextPool(() => l.browser.createBrowserContext())
      const all: Record<string, unknown> = {}
      for (const [pageName, path] of Object.entries(pages)) {
        const results = await runInterleaved(strategies, opts.runs, async (strategy) => {
          const context = await pool.acquire()
          const page = await context.newPage()
          await page.setViewport({ width: 800, height: 450 })
          await setupPage(page)
          const t0 = performance.now()
          const { ready, done, quiet } = await gotoAndWait(page, url(path), strategy as WaitStrategy)
          const waitMs = performance.now() - t0
          await page.screenshot()
          await cleanPage(page)
          pool.release(context)
          return { waitMs, done, ready, quiet: quiet ?? '' }
        })
        all[pageName] = results
        report(`${pageName}`, results, ['waitMs', 'done', 'ready', 'quiet'])
      }
      await pool.drain()
      save('wait', all)
    })
  }
}
