import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import { withEnv, type Experiment } from './common.ts'
import { setupPage, gotoAndWait, cleanPage, type WaitStrategy } from '../lib/capture.ts'
import { report, save } from '../lib/runner.ts'

// Wait strategies on real pages: the public applications of a data-fair instance (by default
// opendata.koumoul.com), captured at the size of data-fair thumbnails. Each capture is compared
// pixel by pixel to a reference taken on a surely settled page (current strategy + 3s). A second
// reference measures the noise of the page itself (maps, dates, random colors...).
//   BENCH_REAL_URL   data-fair base url (default https://opendata.koumoul.com/data-fair)
//   BENCH_REAL_APPS  comma separated application ids (default: up to 2 per base application)
// Captures run one at a time to stay gentle with the instance. Suspect captures are written
// to results/real/ for a visual check.

const baseUrl = process.env.BENCH_REAL_URL ?? 'https://opendata.koumoul.com/data-fair'
const candidates: WaitStrategy[] = ['current', 'idle500-raf', 'idle500-500', 'quiet']
const viewport = { width: 1050, height: 450 }

type App = { id: string, title: string, base: string }

// https://cdn.jsdelivr.net/npm/@data-fair/app-charts@1.4/dist/ and https://koumoul.com/apps/atelier-carto/1.8/
// -> app-charts and atelier-carto
const baseName = (url: string) => url.split('/').filter(s => s && s !== 'dist' && !/^v?\d[\d.]*$/.test(s)).pop()?.replace(/@[^@]*$/, '') || '?'

const listApps = async (): Promise<App[]> => {
  const res = await fetch(`${baseUrl}/api/v1/applications?size=1000&select=id,title,url&visibility=public`)
  const { results } = await res.json() as { results: { id: string, title: string, url: string }[] }
  const apps = results.map(a => ({ id: a.id, title: a.title, base: baseName(a.url ?? '') }))
  const only = process.env.BENCH_REAL_APPS?.split(',')
  if (only) return apps.filter(a => only.includes(a.id))
  const perBase: Record<string, App[]> = {}
  for (const a of apps) {
    perBase[a.base] ??= []
    if (perBase[a.base].length < 2) perBase[a.base].push(a)
  }
  return Object.values(perBase).flat()
}

// share of pixels (%) whose channels differ by more than 40 out of 255
const diffPct = (a: Uint8Array, b: Uint8Array) => {
  const pa = PNG.sync.read(Buffer.from(a))
  const pb = PNG.sync.read(Buffer.from(b))
  if (pa.width !== pb.width || pa.height !== pb.height) return 100
  let diff = 0
  for (let i = 0; i < pa.data.length; i += 4) {
    if (Math.abs(pa.data[i] - pb.data[i]) > 40 || Math.abs(pa.data[i + 1] - pb.data[i + 1]) > 40 || Math.abs(pa.data[i + 2] - pb.data[i + 2]) > 40) diff++
  }
  return Math.round(diff / (pa.width * pa.height) * 10000) / 100
}

export const real: Experiment = {
  description: 'wait strategies on the public applications of a data-fair instance: latency and pixel diff to a settled reference',
  async run (opts) {
    const apps = await listApps()
    console.log(`${apps.length} applications from ${baseUrl}`)
    const outDir = path.join(import.meta.dirname, '..', 'results', 'real')
    fs.mkdirSync(outDir, { recursive: true })
    await withEnv(opts, async ({ l }) => {
      const capture = async (target: string, strategy: WaitStrategy) => {
        const context = await l.browser.createBrowserContext()
        try {
          const page = await context.newPage()
          await page.setViewport(viewport)
          await setupPage(page)
          const t0 = performance.now()
          const r = await gotoAndWait(page, target, strategy)
          const waitMs = performance.now() - t0
          const png = await page.screenshot()
          await cleanPage(page)
          return { ...r, waitMs, png }
        } finally {
          await context.close()
        }
      }
      const rows: Record<string, unknown>[] = []
      const perStrategy: Record<string, { waitMs: number, diff: number, excess: number, suspect: boolean, ready: string }[]> = Object.fromEntries(candidates.map(c => [c, []]))
      for (const app of apps) {
        const target = `${baseUrl}/app/${app.id}`
        try {
          const ref = await capture(target, 'reference')
          const ref2 = await capture(target, 'reference')
          const noise = diffPct(ref.png, ref2.png)
          const row: Record<string, unknown> = { app: app.id, base: app.base, signal: ref.ready === 'triggered' ? 'trigger' : (ref.meta ?? 'none'), noise }
          for (const strategy of candidates) {
            const c = await capture(target, strategy)
            const diff = diffPct(ref.png, c.png)
            // a capture differs from the reference beyond what the page itself varies
            const excess = Math.max(0, diff - noise)
            const suspect = excess > 1
            if (suspect) fs.writeFileSync(path.join(outDir, `${app.base}-${app.id}-${strategy}.png`), c.png)
            row[strategy] = `${Math.round(c.waitMs)}ms ${diff}%${c.quiet ? ' ' + c.quiet : ''}`
            perStrategy[strategy].push({ waitMs: c.waitMs, diff, excess, suspect, ready: c.ready })
          }
          if (Object.values(perStrategy).some(s => s.at(-1)?.suspect)) fs.writeFileSync(path.join(outDir, `${app.base}-${app.id}-reference.png`), ref.png)
          rows.push(row)
          console.log(JSON.stringify(row))
        } catch (err: any) {
          console.log(`${app.id} (${app.base}) failed: ${err.message}`)
        }
      }
      report('per strategy, over all applications', Object.fromEntries(Object.entries(perStrategy).map(([k, v]) => [k, v.map(s => ({ waitMs: s.waitMs, excessDiffPct: s.excess, suspect: s.suspect }))])), ['waitMs', 'excessDiffPct', 'suspect'])
      save('real', rows)
    })
  }
}
