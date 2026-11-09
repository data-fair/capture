import { startFixturesServer } from '../lib/server.ts'
import { browserVariants, launch } from '../lib/browsers.ts'
import { setupPage, gotoAndWait } from '../lib/capture.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'
import type { Experiment } from './common.ts'
import type { Page } from 'puppeteer'

// H: the outputs travel back base64 encoded in CDP messages over a websocket. A pipe transport
// (--remote-debugging-pipe) spares the websocket framing and the TCP loopback on large outputs.

export const transport: Experiment = {
  description: 'websocket vs pipe CDP transport on large screenshots and PDFs',
  async run (opts) {
    const server = await startFixturesServer()
    const variant = browserVariants[opts.browser]
    const ws = await launch(variant, { pipe: false })
    const pipe = await launch(variant, { pipe: true })
    const pages: Record<string, Page> = {}
    for (const [name, l] of Object.entries({ websocket: ws, pipe })) {
      const page = await (await l.browser.createBrowserContext()).newPage()
      await page.setViewport({ width: 1920, height: 1080 })
      await setupPage(page)
      await gotoAndWait(page, server.url('/fixtures/long.html?sections=20'), 'idle0-raf')
      pages[name] = page
    }
    const results = await runInterleaved(Object.keys(pages), opts.runs, async (name) => {
      let t = performance.now()
      const shot = await pages[name].screenshot({ captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1920, height: 3000 } })
      const shotMs = performance.now() - t
      t = performance.now()
      const pdf = await pages[name].pdf({ format: 'A4' })
      const pdfMs = performance.now() - t
      return { shotMs, shotKB: shot.length / 1024, pdfMs, pdfKB: pdf.length / 1024 }
    })
    report('1920x3000 png and long pdf', results, ['shotMs', 'shotKB', 'pdfMs', 'pdfKB'])
    await ws.browser.close()
    await pipe.browser.close()
    await server.close()
    save('transport', results)
  }
}
