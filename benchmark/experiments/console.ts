import { withEnv, type Experiment } from './common.ts'
import { setupPage, gotoAndWait, cleanPage, createContextPool } from '../lib/capture.ts'
import { selfCpuMs } from '../lib/proc.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'

// H: the debugPage console listener is attached on every page even when DEBUG is off, and does
// 2 CDP round trips per argument of every console message (getProperty + jsonValue). On a verbose
// page this costs latency and node CPU for nothing.

export const consoleListener: Experiment = {
  description: 'cost of the always-on console listener on a page logging 500 messages',
  async run (opts) {
    await withEnv(opts, async ({ url, l }) => {
      const pool = createContextPool(() => l.browser.createBrowserContext())
      const results = await runInterleaved(['listener', 'no-listener'], opts.runs, async (variant) => {
        const c = await pool.acquire()
        const page = await c.newPage()
        await setupPage(page, { consoleListener: variant === 'listener' })
        const cpu0 = selfCpuMs()
        const t0 = performance.now()
        await gotoAndWait(page, url('/fixtures/console.html?logs=500'), 'idle0')
        await page.screenshot()
        const totalMs = performance.now() - t0
        // let the pending listener round trips land, they are paid even if after the response
        await new Promise(resolve => setTimeout(resolve, 300))
        const nodeCpuMs = selfCpuMs() - cpu0
        await cleanPage(page)
        pool.release(c)
        return { totalMs, nodeCpuMs }
      })
      report('console.html?logs=500', results, ['totalMs', 'nodeCpuMs'])
      await pool.drain()
      save('console', results)
    })
  }
}
