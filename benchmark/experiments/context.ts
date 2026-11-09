import { withEnv, type Experiment } from './common.ts'
import { cleanPage, createContextPool } from '../lib/capture.ts'
import { treeCpuMs } from '../lib/proc.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'
import type { Page } from 'puppeteer'

// H: the per-capture cost of the browser plumbing (context, page, setup CDP calls) is small next
// to the waits. Variants: the service's pooled context + new page; a fresh context per capture
// (no pool, no cookie cleanup); a reused page (the floor, not safe across users).
// Also: the cost of each setup step taken one by one.

export const context: Experiment = {
  description: 'pooled context vs fresh context vs reused page, and the cost of each page setup call',
  async run (opts) {
    await withEnv(opts, async ({ url, l }) => {
      const pool = createContextPool(() => l.browser.createBrowserContext())
      const reused = await (await l.browser.createBrowserContext()).newPage()
      await reused.setViewport({ width: 800, height: 450 })
      const target = url('/fixtures/static.html')
      const results = await runInterleaved(['pool+newPage', 'fresh-context', 'reused-page'], opts.runs * 2, async (variant) => {
        const cpu0 = treeCpuMs(l.pid)
        const t0 = performance.now()
        let page: Page
        if (variant === 'reused-page') {
          page = reused
        } else if (variant === 'fresh-context') {
          page = await (await l.browser.createBrowserContext()).newPage()
          await page.setViewport({ width: 800, height: 450 })
        } else {
          page = await (await pool.acquire()).newPage()
          await page.setViewport({ width: 800, height: 450 })
        }
        const tPage = performance.now()
        await page.goto(target, { waitUntil: 'load' })
        await page.screenshot()
        const tShot = performance.now()
        if (variant === 'fresh-context') await page.browserContext().close()
        else if (variant === 'pool+newPage') {
          const c = page.browserContext()
          await cleanPage(page)
          pool.release(c)
        }
        const tEnd = performance.now()
        await new Promise(resolve => setTimeout(resolve, 50))
        return { pageMs: tPage - t0, gotoShotMs: tShot - tPage, cleanupMs: tEnd - tShot, totalMs: tEnd - t0, browserCpuMs: treeCpuMs(l.pid) - cpu0 }
      })
      report('static page, goto load + screenshot', results, ['pageMs', 'gotoShotMs', 'cleanupMs', 'totalMs', 'browserCpuMs'])

      // each setup call of the service, timed alone on a fresh page
      const steps: Record<string, (p: Page) => Promise<unknown>> = {
        newPage: async () => {},
        setViewport: p => p.setViewport({ width: 800, height: 450 }),
        emulateTimezone: p => p.emulateTimezone('Europe/Paris'),
        setExtraHTTPHeaders: p => p.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR' }),
        evaluateOnNewDocument: p => p.evaluateOnNewDocument(() => {}),
        exposeFunction: p => p.exposeFunction('triggerCapture' + Math.random().toString(36).slice(2), () => {}),
        setRequestInterception: p => p.setRequestInterception(true),
        metaLookup: p => p.$eval('head > meta[name=\'x-capture\']', el => el.content).catch(() => undefined),
        cleanPage: p => cleanPage(p)
      }
      const stepResults = await runInterleaved(['steps'], opts.runs * 2, async () => {
        const sample: Record<string, number> = {}
        const t0 = performance.now()
        const c = await pool.acquire()
        const p = await c.newPage()
        sample.newPage = performance.now() - t0
        for (const [k, fn] of Object.entries(steps)) {
          if (k === 'newPage') continue
          const t = performance.now()
          await fn(p)
          sample[k] = performance.now() - t
        }
        pool.release(c)
        return sample
      })
      report('setup steps, ms each', stepResults, Object.keys(steps))
      await pool.drain()
      save('context', { results, stepResults })
    })
  }
}
