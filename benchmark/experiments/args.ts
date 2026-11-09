import { startFixturesServer } from '../lib/server.ts'
import { browserVariants, launch } from '../lib/browsers.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'
import { runLoad } from './concurrency.ts'
import type { Experiment } from './common.ts'

// H: some launch flags reduce the browser's CPU or memory per capture: no GPU process (software
// raster in the renderer), fewer background features, no site isolation (fewer processes),
// a renderer process limit. Measured at concurrency 5 on the CPU-bound page and on the app page.

const argVariants: Record<string, string[]> = {
  default: [],
  'no-sandbox': ['--no-sandbox'],
  'disable-gpu': ['--disable-gpu'],
  'no-site-isolation': ['--disable-site-isolation-trials', '--disable-features=IsolateOrigins,site-per-process'],
  'renderer-limit-2': ['--renderer-process-limit=2'],
  'disable-features': ['--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,InterestFeedContentSuggestions,CertificateTransparencyComponentUpdater,AutofillServerCommunication,PrivacySandboxSettings4,LensOverlay,PaintHolding', '--disable-component-update', '--no-default-browser-check'],
  'swiftshader-in-process': ['--use-gl=angle', '--use-angle=swiftshader', '--in-process-gpu']
}

export const args: Experiment = {
  description: 'chrome launch flags: CPU, memory and process count at concurrency 5',
  async run (opts) {
    const server = await startFixturesServer()
    const variant = browserVariants[opts.browser]
    const all: Record<string, unknown> = {}
    for (const [loadName, load] of Object.entries({
      'heavy 1280x800': { path: '/fixtures/heavy.html?n=15000', viewport: { width: 1280, height: 800 }, strategy: 'idle0-raf' as const },
      'app-trigger 800x450': { path: '/fixtures/app.html?trigger=1', viewport: { width: 800, height: 450 }, strategy: 'idle0-raf' as const }
    })) {
      const results = await runInterleaved(Object.keys(argVariants), Math.max(2, Math.round(opts.runs / 3)), async (name) => {
        const l = await launch(variant, { args: argVariants[name] })
        try {
          return await runLoad([l], server.url, load, 5, 20)
        } finally {
          await l.browser.close()
        }
      }, 0)
      all[loadName] = results
      report(loadName, results, ['perSec', 'p50Ms', 'cpuMsPerCapture', 'peakPssMB', 'peakProcs'])
    }
    await server.close()
    save('args', all)
  }
}
