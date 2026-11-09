import { startFixturesServer } from '../lib/server.ts'
import { browserVariants, launch, browserFootprint, type Launched } from '../lib/browsers.ts'
import { setupPage, gotoAndWait, cleanPage, createContextPool } from '../lib/capture.ts'
import { treeCpuMs } from '../lib/proc.ts'
import { runInterleaved, report, save, step } from '../lib/runner.ts'
import type { Experiment } from './common.ts'

// H: chrome-headless-shell (the old headless mode, a separate lighter binary) launches faster,
// renders and encodes faster and uses less memory than the full chrome binary in new headless mode
// that the image installs today. Chrome for Testing in new headless mode separates the effect of
// the version (stable 150 vs CfT 156) from the effect of the headless mode (CfT 156 vs shell 156).

const tasks = {
  'app-png': { path: '/fixtures/app.html?trigger=1', viewport: { width: 800, height: 450 }, out: 'png' },
  'heavy-png': { path: '/fixtures/heavy.html', viewport: { width: 1920, height: 1080 }, out: 'png' },
  'long-pdf': { path: '/fixtures/long.html', viewport: undefined, out: 'pdf' }
} as const

export const browser: Experiment = {
  description: 'chrome-stable vs Chrome for Testing vs chrome-headless-shell: launch, capture time, CPU, memory',
  async run (opts) {
    const server = await startFixturesServer()
    const names = Object.keys(browserVariants)
    const launched: Record<string, Launched> = {}
    const launchResults = await runInterleaved(names, Math.min(opts.runs, 5), async (name) => {
      const l = await launch(browserVariants[name])
      const sample = { launchMs: l.launchMs, idlePssMB: browserFootprint(l).pssMB, processes: browserFootprint(l).processes }
      await l.browser.close()
      return sample
    }, 0)
    report('launch (fresh process, no page)', launchResults, ['launchMs', 'idlePssMB', 'processes'])
    for (const name of names) {
      launched[name] = await launch(browserVariants[name])
      console.log(`${name}: ${launched[name].version}`)
    }
    const pools = Object.fromEntries(names.map(n => [n, createContextPool(() => launched[n].browser.createBrowserContext())]))
    const all: Record<string, unknown> = { launch: launchResults }
    for (const [taskName, task] of Object.entries(tasks)) {
      const results = await runInterleaved(names, opts.runs, async (name) => {
        const l = launched[name]
        const cpu0 = treeCpuMs(l.pid)
        const t0 = performance.now()
        step('newPage')
        const context = await pools[name].acquire()
        const page = await context.newPage()
        if (task.viewport) await page.setViewport(task.viewport)
        step('setup')
        await setupPage(page)
        step('goto')
        await gotoAndWait(page, server.url(task.path), 'idle0-raf')
        const t1 = performance.now()
        step('output')
        const buf = task.out === 'png' ? await page.screenshot() : await page.pdf({ format: 'A4', printBackground: true })
        const t2 = performance.now()
        step('clean')
        await cleanPage(page)
        pools[name].release(context)
        await new Promise(resolve => setTimeout(resolve, 100)) // let the renderer exit before reading CPU
        return { openMs: t1 - t0, outputMs: t2 - t1, totalMs: t2 - t0, browserCpuMs: treeCpuMs(l.pid) - cpu0, KB: buf.length / 1024 }
      })
      all[taskName] = results
      report(taskName, results, ['openMs', 'outputMs', 'totalMs', 'browserCpuMs', 'KB'])
    }
    const footprint = Object.fromEntries(names.map(n => [n, [browserFootprint(launched[n])]]))
    report('footprint after the captures above (contexts kept in pool)', footprint, ['pssMB', 'processes'])
    for (const name of names) await launched[name].browser.close()
    await server.close()
    save('browser', all)
  }
}
