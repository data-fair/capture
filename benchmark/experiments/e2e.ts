import { spawn, type ChildProcess } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { startFixturesServer } from '../lib/server.ts'
import { treeCpuMs } from '../lib/proc.ts'
import { aggregate } from '../lib/stats.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'
import type { Experiment } from './common.ts'

// The real service, started as a child process from the working tree (or from BENCH_E2E_DIR, e.g.
// a worktree of master, to compare 2 versions), and loaded over HTTP. Scenarios:
//  - png: 20 screenshots of the app page at concurrency 5, the timer breakdown of the service
//  - gif+ping: an animated capture while a probe requests api-docs every 20ms, the probe latency
//    shows how long the service's event loop is blocked for every other request
// BENCH_E2E_CONFIG (JSON) is merged in the service's config, e.g. a browser or a concurrency.

const freePort = () => new Promise<number>(resolve => {
  const s = net.createServer().listen(0, () => {
    const port = (s.address() as net.AddressInfo).port
    s.close(() => resolve(port))
  })
})

const startService = async (dir: string, extraConfig: Record<string, unknown>) => {
  const port = await freePort()
  const child: ChildProcess = spawn('node', ['--disable-warning=ExperimentalWarning', 'api/index.ts'], {
    cwd: dir,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      NODE_CONFIG: JSON.stringify({ port, onlySameHost: false, concurrency: 5, observer: { active: false }, ...extraConfig })
    },
    stdio: ['ignore', 'ignore', 'pipe']
  })
  child.stderr?.on('data', () => {})
  const base = `http://127.0.0.1:${port}/api/v1`
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + '/api-docs.json')).ok) return { base, child }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  child.kill()
  throw new Error('service did not start')
}

export const e2e: Experiment = {
  description: 'the real service over HTTP: png load at concurrency 5, event loop blocking during a gif',
  async run (opts) {
    const fixtures = await startFixturesServer()
    const dir = process.env.BENCH_E2E_DIR ?? path.join(import.meta.dirname, '..', '..')
    const extra = JSON.parse(process.env.BENCH_E2E_CONFIG ?? '{}')
    const { base, child } = await startService(dir, extra)
    console.log(`service from ${dir}, config ${JSON.stringify(extra)}`)
    const shot = (target: string, q = '') => fetch(`${base}/screenshot?key=capture&target=${encodeURIComponent(target)}${q}`, { headers: { 'x-secret-key': 'capture' } })
    try {
      const all: Record<string, unknown> = {}
      for (const [name, page] of Object.entries({ app: '/fixtures/app.html', 'app-trigger': '/fixtures/app.html?trigger=1' })) {
        const results = await runInterleaved(['c5'], Math.max(2, Math.round(opts.runs / 2)), async () => {
          const total = 20
          let next = 0
          const latencies: number[] = []
          const steps: Record<string, number[]> = {}
          const cpu0 = treeCpuMs(child.pid!)
          const t0 = performance.now()
          await Promise.all(Array.from({ length: 5 }, async () => {
            while (next < total) {
              next++
              const s = performance.now()
              const res = await shot(fixtures.url(page), '&timer=true')
              const times = await res.json() as Record<string, number>
              latencies.push(performance.now() - s)
              for (const [k, v] of Object.entries(times)) (steps[k] ??= []).push(v)
            }
          }))
          const wallMs = performance.now() - t0
          const lat = aggregate(latencies)
          return {
            perSec: total / wallMs * 1000,
            p50Ms: lat.median,
            p90Ms: lat.p90,
            cpuMsPerCapture: (treeCpuMs(child.pid!) - cpu0) / total,
            ...Object.fromEntries(Object.entries(steps).map(([k, v]) => [k, aggregate(v).median]))
          }
        }, 1)
        all[name] = results
        report(`${name}, 20 screenshots at concurrency 5 (service + browser CPU)`, results, ['perSec', 'p50Ms', 'p90Ms', 'cpuMsPerCapture'])
        const stepNames = Object.keys(results.c5[0]).filter(k => !['perSec', 'p50Ms', 'p90Ms', 'cpuMsPerCapture'].includes(k))
        report(`${name}, median of the service timer steps (ms)`, results, stepNames)
      }
      const gifResults = await runInterleaved(['gif'], Math.max(2, Math.round(opts.runs / 4)), async () => {
        const state = { stop: false }
        const pings: number[] = []
        const probe = (async () => {
          while (!state.stop) {
            const s = performance.now()
            await fetch(base + '/api-docs.json').then(r => r.arrayBuffer())
            pings.push(performance.now() - s)
            await new Promise(resolve => setTimeout(resolve, 20))
          }
        })()
        const s = performance.now()
        const res = await shot(fixtures.url('/fixtures/anim.html?frames=30'), '&type=gif&width=800&height=450')
        const buf = await res.arrayBuffer()
        const gifMs = performance.now() - s
        state.stop = true
        await probe
        const p = aggregate(pings)
        return { gifMs, KB: buf.byteLength / 1024, pingP50Ms: p.median, pingP90Ms: p.p90, pingMaxMs: p.max }
      }, 0)
      all.gif = gifResults

      // overload: 30 clients that give up after 2s (a proxy timeout, a user leaving), then one
      // patient client. If the abandoned requests still wait for a context and get rendered,
      // the patient one queues behind work done for nobody.
      const abandon = await (async () => {
        const controllers = Array.from({ length: 30 }, () => new AbortController())
        const pending = controllers.map(c => fetch(`${base}/screenshot?target=${encodeURIComponent(fixtures.url('/fixtures/app.html'))}`, { headers: { 'x-secret-key': 'capture' }, signal: c.signal }).then(r => r.arrayBuffer()).catch(() => {}))
        await new Promise(resolve => setTimeout(resolve, 2000))
        for (const c of controllers) c.abort()
        await Promise.all(pending)
        const s = performance.now()
        const res = await shot(fixtures.url('/fixtures/app.html?trigger=1'))
        await res.arrayBuffer()
        return { patientMs: performance.now() - s, status: String(res.status) }
      })()
      all.abandon = abandon
      console.log(`\n### overload: 30 requests abandoned after 2s, then 1 request (app?trigger=1, ~0.7s alone)\n\npatient request: ${Math.round(abandon.patientMs)}ms, status ${abandon.status}`)
      report('gif 800x450 30 frames, with a probe on api-docs every 20ms', gifResults, ['gifMs', 'KB', 'pingP50Ms', 'pingP90Ms', 'pingMaxMs'])
      save('e2e', all)
    } finally {
      child.kill('SIGINT')
      await new Promise(resolve => child.once('exit', resolve))
      await fixtures.close()
    }
  }
}
