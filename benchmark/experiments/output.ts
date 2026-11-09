import { withEnv, type Experiment } from './common.ts'
import { setupPage, gotoAndWait, cleanPage } from '../lib/capture.ts'
import { treeCpuMs } from '../lib/proc.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'
import type { Page, ScreenshotOptions, PDFOptions } from 'puppeteer'

// H: encoding the output is a sizable share of a capture on large viewports. PNG compression in
// the browser is slow, optimizeForSpeed / jpeg / webp are cheaper. For PDF, the tagged structure
// (accessibility tree, on by default) and the document outline cost time on long documents.
// The page is opened once per task and the output is taken repeatedly.

const shots: Record<string, ScreenshotOptions> = {
  png: {},
  'png-fast': { optimizeForSpeed: true },
  'jpeg-80': { type: 'jpeg', quality: 80 },
  'webp-80': { type: 'webp', quality: 80 }
}
const shotPages = {
  'app 800x450': { path: '/fixtures/app.html?trigger=1', viewport: { width: 800, height: 450 }, fullPage: false },
  'heavy 1920x1080': { path: '/fixtures/heavy.html', viewport: { width: 1920, height: 1080 }, fullPage: false },
  'long fullPage 1280': { path: '/fixtures/long.html?sections=10', viewport: { width: 1280, height: 800 }, fullPage: true }
}

const pdfs: Record<string, PDFOptions> = {
  default: {},
  'tagged-false': { tagged: false },
  outline: { outline: true },
  footer: { displayHeaderFooter: true, headerTemplate: ' ', footerTemplate: '<div style="font-size:8px;width:100%;text-align:center"><span class="pageNumber"></span>/<span class="totalPages"></span></div>' }
}

export const output: Experiment = {
  description: 'screenshot formats (png, png optimizeForSpeed, jpeg, webp) and pdf options (tagged, outline, footer)',
  async run (opts) {
    await withEnv(opts, async ({ url, l }) => {
      const all: Record<string, unknown> = {}
      const context = await l.browser.createBrowserContext()
      const open = async (path: string, viewport?: { width: number, height: number }) => {
        const page: Page = await context.newPage()
        if (viewport) await page.setViewport(viewport)
        await setupPage(page)
        await gotoAndWait(page, url(path), 'idle0-raf')
        return page
      }
      for (const [name, p] of Object.entries(shotPages)) {
        const page = await open(p.path, p.viewport)
        const results = await runInterleaved(Object.keys(shots), opts.runs, async (v) => {
          const cpu0 = treeCpuMs(l.pid)
          const t0 = performance.now()
          const buf = await page.screenshot({ ...shots[v], fullPage: p.fullPage })
          return { ms: performance.now() - t0, browserCpuMs: treeCpuMs(l.pid) - cpu0, KB: buf.length / 1024 }
        })
        all[name] = results
        report(`screenshot: ${name}`, results, ['ms', 'browserCpuMs', 'KB'])
        await cleanPage(page)
      }
      for (const sections of [30, 120]) {
        const page = await open(`/fixtures/long.html?sections=${sections}`)
        const results = await runInterleaved(Object.keys(pdfs), opts.runs, async (v) => {
          const cpu0 = treeCpuMs(l.pid)
          const t0 = performance.now()
          const buf = await page.pdf({ format: 'A4', printBackground: true, margin: { left: '1.5cm', right: '1.5cm', top: '1.5cm', bottom: '1.5cm' }, ...pdfs[v] })
          return { ms: performance.now() - t0, browserCpuMs: treeCpuMs(l.pid) - cpu0, KB: buf.length / 1024 }
        })
        all[`pdf-${sections}`] = results
        report(`pdf: long.html, ${sections} sections`, results, ['ms', 'browserCpuMs', 'KB'])
        await cleanPage(page)
      }
      await context.close()
      save('output', all)
    })
  }
}
