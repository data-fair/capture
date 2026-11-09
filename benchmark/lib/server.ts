import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import type { AddressInfo } from 'node:net'

// Serves the fixtures pages, with an artificial latency (?delay=ms) on any response so that pages
// behave like data-fair applications that fetch from a remote API.
//   /fixtures/<name>.html      a page
//   /asset.js?kb=300&delay=80  a script of the given size (parsed and executed by the page)
//   /data?n=500&delay=150      a JSON array of n random points
//   /font.woff2?delay=500      a font (DejaVu Sans from the system, whatever the extension says)

const fixturesDir = path.join(import.meta.dirname, '..', 'fixtures')

const assetCache = new Map<number, string>()
const asset = (kb: number) => {
  let src = assetCache.get(kb)
  if (!src) {
    const lines = ['window.__lib = {}']
    let i = 0
    while (lines.join('\n').length < kb * 1024) {
      lines.push(`window.__lib.f${i} = function (a, b) { const r = []; for (let k = 0; k < a; k++) r.push({ k, v: Math.sin(k * ${i}) * b, s: 'item-' + k }); return r.filter(x => x.v > 0).map(x => x.s).join(',') }`)
      i++
    }
    src = lines.join('\n')
    assetCache.set(kb, src)
  }
  return src
}

const data = (n: number) => {
  const points = []
  for (let i = 0; i < n; i++) points.push({ x: i, y: Math.round(Math.abs(Math.sin(i / 10) * 100 + Math.random() * 20)), label: 'Point ' + i })
  return JSON.stringify(points)
}

export const startFixturesServer = async () => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const delay = Number(url.searchParams.get('delay') ?? 0)
    setTimeout(() => {
      if (url.pathname.startsWith('/fixtures/')) {
        const file = path.join(fixturesDir, path.basename(url.pathname))
        if (!fs.existsSync(file)) return res.writeHead(404).end()
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        res.end(fs.readFileSync(file))
      } else if (url.pathname === '/asset.js') {
        res.writeHead(200, { 'content-type': 'application/javascript', 'cache-control': 'no-store' })
        res.end(asset(Number(url.searchParams.get('kb') ?? 100)))
      } else if (url.pathname === '/font.woff2') {
        res.writeHead(200, { 'content-type': 'font/ttf', 'cache-control': 'no-store' })
        res.end(fs.readFileSync('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
      } else if (url.pathname === '/data') {
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
        res.end(data(Number(url.searchParams.get('n') ?? 100)))
      } else {
        res.writeHead(404).end()
      }
    }, delay)
  })
  server.keepAliveTimeout = 60000
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  return {
    url: (p: string) => `http://127.0.0.1:${port}${p}`,
    close: () => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()) })
  }
}
