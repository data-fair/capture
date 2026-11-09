import fs from 'node:fs'
import { startFixturesServer } from '../lib/server.ts'
import { browserVariants, launch } from '../lib/browsers.ts'
import { processTree } from '../lib/proc.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'
import { runLoad } from './concurrency.ts'
import type { Experiment } from './common.ts'

// H: a single browser saturates at about 2 cores on paint-heavy pages, whatever the
// concurrency, because one of its processes is a serial bottleneck (the GPU process
// composites and rasterizes for all renderers). The CPU time is split by process type, from
// the --type= argument of each chrome process, sampled during the load. A process that sits
// near 100% of one core is the bottleneck.

const typeOf = (pid: number) => {
  try {
    // chrome rewrites its title as a single space separated string
    const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split(/[\0 ]/)
    const type = cmd.find(a => a.startsWith('--type='))?.slice(7) ?? 'browser'
    const sub = cmd.find(a => a.startsWith('--utility-sub-type='))?.slice(19).split('.').pop()
    return sub ? `${type}:${sub}` : type
  } catch {
    return 'gone'
  }
}
const ticks = (pid: number) => {
  try {
    const raw = fs.readFileSync(`/proc/${pid}/stat`, 'utf8')
    const f = raw.slice(raw.lastIndexOf(')') + 2).split(' ')
    return Number(f[11]) + Number(f[12])
  } catch {
    return 0
  }
}

const launchVariants: Record<string, { browser: string, args: string[] }> = {
  'chrome-stable': { browser: 'chrome-stable', args: [] },
  'chrome-stable --disable-gpu': { browser: 'chrome-stable', args: ['--disable-gpu'] },
  shell: { browser: 'shell', args: [] }
}

export const hotspot: Experiment = {
  description: 'CPU by chrome process type at concurrency 10 on a paint-heavy page: which process caps a browser',
  async run (opts) {
    const server = await startFixturesServer()
    const results = await runInterleaved(Object.keys(launchVariants), Math.max(1, Math.round(opts.runs / 4)), async (name) => {
      const v = launchVariants[name]
      const l = await launch(browserVariants[v.browser], { args: v.args })
      // per pid: first and last ticks seen, the processes of closed pages included
      const seen = new Map<number, { type: string, first: number, last: number }>()
      const sample = () => {
        for (const pid of processTree(l.pid)) {
          const t = ticks(pid)
          const s = seen.get(pid)
          if (s) s.last = t
          else seen.set(pid, { type: typeOf(pid), first: t, last: t })
        }
      }
      sample()
      const t0 = performance.now()
      const sampler = setInterval(sample, 100)
      const load = await runLoad([l], server.url, { path: '/fixtures/heavy.html?n=15000', viewport: { width: 1280, height: 800 }, strategy: 'idle0-raf' }, 10, 30)
      clearInterval(sampler)
      sample()
      const wallMs = performance.now() - t0
      await l.browser.close()
      // share of one core used by each process type, and by its busiest single process
      const byType: Record<string, number> = {}
      const maxProc: Record<string, number> = {}
      for (const s of seen.values()) {
        const cores = (s.last - s.first) * 10 / wallMs
        const key = s.type.startsWith('renderer') ? 'renderer' : s.type
        byType[key] = (byType[key] ?? 0) + cores
        maxProc[key] = Math.max(maxProc[key] ?? 0, cores)
      }
      if (process.env.BENCH_DEBUG) console.log([...seen.entries()].map(([pid, s]) => `${pid} ${s.type} ${s.last - s.first}`).join('\n'))
      const out: Record<string, number> = { perSec: load.perSec, p50Ms: load.p50Ms }
      for (const k of ['browser', 'gpu-process', 'renderer', 'utility:mojom']) {
        out[k + '.cores'] = byType[k] ?? 0
        out[k + '.maxProc'] = maxProc[k] ?? 0
      }
      for (const [k, c] of Object.entries(byType)) if (!(k + '.cores' in out)) out[k + '.cores'] = c
      return out
    }, 0)
    const metrics = [...new Set(Object.values(results).flat().flatMap(s => Object.keys(s)))]
    report('heavy 1280x800 at concurrency 10, CPU in cores by process type (maxProc = busiest single process)', results, metrics)
    await server.close()
    save('hotspot', results)
  }
}
