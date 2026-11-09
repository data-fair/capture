import { startFixturesServer } from '../lib/server.ts'
import { browserVariants, launch, type Launched } from '../lib/browsers.ts'
import { setupPage, gotoAndWait, cleanPage, createContextPool, type WaitStrategy } from '../lib/capture.ts'
import { treeCpuMs, treePssMB, treeSize } from '../lib/proc.ts'
import { aggregate } from '../lib/stats.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'
import type { Experiment } from './common.ts'
import type { ScreenshotOptions } from 'puppeteer'

// H: with the current wait strategy a capture is mostly idle time, so throughput scales almost
// linearly with the number of contexts, and the default concurrency (5) leaves the machine idle.
// On a paint-heavy page the browser CPU saturates instead and more concurrency only adds latency.
// Also: one browser vs 2 browsers for the same concurrency.

type Load = { path: string, viewport: { width: number, height: number }, strategy: WaitStrategy, shot?: ScreenshotOptions }
const loads: Record<string, Load> = {
  'app (I/O bound, current wait)': { path: '/fixtures/app.html', viewport: { width: 800, height: 450 }, strategy: 'current' },
  'heavy 1280x800 (CPU bound)': { path: '/fixtures/heavy.html?n=15000', viewport: { width: 1280, height: 800 }, strategy: 'idle0-raf' }
}

const runLoad = async (browsers: Launched[], url: (p: string) => string, load: Load, concurrency: number, total: number) => {
  const pools = browsers.map(l => createContextPool(() => l.browser.createBrowserContext()))
  const latencies: number[] = []
  let next = 0
  let peakPss = 0
  let peakProcs = 0
  const sampler = setInterval(() => {
    peakPss = Math.max(peakPss, browsers.reduce((a, l) => a + treePssMB(l.pid), 0))
    peakProcs = Math.max(peakProcs, browsers.reduce((a, l) => a + treeSize(l.pid), 0))
  }, 250)
  const cpu0 = browsers.reduce((a, l) => a + treeCpuMs(l.pid), 0)
  const t0 = performance.now()
  await Promise.all(Array.from({ length: concurrency }, async (_, w) => {
    const pool = pools[w % pools.length]
    while (next < total) {
      next++
      const s = performance.now()
      const c = await pool.acquire()
      const page = await c.newPage()
      await page.setViewport(load.viewport)
      await setupPage(page)
      await gotoAndWait(page, url(load.path), load.strategy)
      await page.screenshot(load.shot)
      await cleanPage(page)
      pool.release(c)
      latencies.push(performance.now() - s)
    }
  }))
  const wallMs = performance.now() - t0
  clearInterval(sampler)
  await new Promise(resolve => setTimeout(resolve, 200))
  const cpuMs = browsers.reduce((a, l) => a + treeCpuMs(l.pid), 0) - cpu0
  for (const p of pools) await p.drain()
  const lat = aggregate(latencies)
  return { perSec: total / wallMs * 1000, p50Ms: lat.median, p90Ms: lat.p90, cpuMsPerCapture: cpuMs / total, cores: cpuMs / wallMs, peakPssMB: peakPss, peakProcs }
}

export const concurrency: Experiment = {
  description: 'throughput, latency, CPU and memory for 1..20 concurrent captures, 1 or 2 browsers',
  async run (opts) {
    const server = await startFixturesServer()
    const variant = browserVariants[opts.browser]
    const b1 = await launch(variant)
    const b2 = await launch(variant)
    console.log(`browser: ${variant.name} ${b1.version}`)
    const all: Record<string, unknown> = {}
    const configs: Record<string, { c: number, browsers: Launched[] }> = {
      c1: { c: 1, browsers: [b1] },
      c2: { c: 2, browsers: [b1] },
      c5: { c: 5, browsers: [b1] },
      c10: { c: 10, browsers: [b1] },
      c20: { c: 20, browsers: [b1] },
      'c10-2browsers': { c: 10, browsers: [b1, b2] }
    }
    for (const [loadName, load] of Object.entries(loads)) {
      const results = await runInterleaved(Object.keys(configs), Math.max(2, Math.round(opts.runs / 4)), async (name) => {
        const { c, browsers } = configs[name]
        return runLoad(browsers, server.url, load, c, Math.max(10, c * 3))
      }, 0)
      all[loadName] = results
      report(loadName, results, ['perSec', 'p50Ms', 'p90Ms', 'cpuMsPerCapture', 'cores', 'peakPssMB', 'peakProcs'])
    }
    await b1.browser.close()
    await b2.browser.close()
    await server.close()
    save('concurrency', all)
  }
}

export { runLoad }
