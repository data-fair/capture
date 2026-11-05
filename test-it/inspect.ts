import assert from 'assert/strict'
import http from 'node:http'
import { promisify } from 'node:util'
import getPixelsCb from 'get-pixels'
import * as server from '../api/server.ts'
import axios from 'axios'
import { describe, before, after, it } from 'node:test'
import config from '#config'

const getPixels = promisify(getPixelsCb)
const pngSize = async (data: Buffer) => {
  const [width, height] = (await getPixels(data, 'image/png')).shape
  return { width, height }
}

const origin = `http://localhost:${config.port}`
const ax = axios.create({ baseURL: `${origin}/api/v1/`, validateStatus: () => true })
const key = 'capture'
const inspect = (path: string, params: Record<string, any> = {}, headers: Record<string, string> = { 'x-secret-key': key }) =>
  ax.get('inspect', { params: { target: origin + path, ...params }, headers })

describe('inspect', () => {
  before(async function () {
    await server.start()
  })
  after(async () => {
    // let the last request release its page before the browser is closed
    await new Promise(resolve => setTimeout(resolve, 300))
    await server.stop()
  })

  it('inspects a page with errors', async () => {
    const res = await inspect('/test/resources/test-errors.html')
    assert.equal(res.status, 200)
    assert.equal(res.data.image.mediaType, 'image/png')
    assert.deepEqual(await pngSize(Buffer.from(res.data.image.data, 'base64')), { width: 1280, height: 800 })
    const r = res.data.report
    assert.equal(r.ready, 'triggered')
    assert.equal(r.status, 200)
    assert.ok(r.consoleErrors.some((e: any) => e.text.includes('boom-console')))
    assert.ok(r.pageErrors.some((e: string) => e.includes('boom-page')))
    assert.deepEqual(r.failedRequests.map((f: any) => [f.path, f.status]), [['/test/resources/missing.json', 404]])
    assert.equal(r.verdict, 'errors')
    assert.ok(res.data.text.startsWith('### Page\n- Page URL: '))
    assert.match(res.data.text, /\[ERROR\] boom-console @ /)
    assert.match(res.data.text, /\d+\. \[GET\] .*\/test\/resources\/missing\.json => \[404\] Not Found/)
    assert.match(res.data.text, /- Verdict: errors/)
  })

  it('snapshot in Playwright syntax', async () => {
    const res = await inspect('/test/resources/test-snapshot.html')
    assert.equal(res.status, 200)
    const lines: string[] = res.data.report.snapshot.split('\n').map((l: string) => l.trim())
    for (const expected of ['- heading "Hello" [level=1]', '- link "Next":', '- /url: /next', '- paragraph: Some text', '- checkbox "Agree" [checked]']) {
      assert.ok(lines.includes(expected), `missing line ${expected} in\n${res.data.report.snapshot}`)
    }
    const frameIndex = res.data.report.snapshot.split('\n').findIndex((l: string) => l.trim().startsWith('- iframe'))
    assert.ok(frameIndex >= 0, 'missing iframe line')
    const all = res.data.report.snapshot.split('\n')
    const frameIndent = all[frameIndex].search(/\S/)
    assert.ok(all.slice(frameIndex + 1).some((l: string) => l.search(/\S/) > frameIndent && l.includes('Test page 1')))
    assert.ok(!res.data.report.snapshot.includes('[ref='))
    assert.ok(res.data.text.includes('### Snapshot\n```yaml\n'))
  })

  it('truncates a big snapshot', async () => {
    const res = await inspect('/test/resources/test-big.html')
    assert.equal(res.status, 200)
    const snapshot: string = res.data.report.snapshot
    assert.ok(snapshot.length <= 20000)
    assert.match(snapshot.split('\n').at(-1)!, /^# snapshot truncated: \d+ more lines$/)
  })

  it('mobile viewport', async () => {
    const res = await inspect('/test/resources/test-snapshot.html', { mobile: 'true' })
    assert.equal(res.status, 200)
    assert.deepEqual(await pngSize(Buffer.from(res.data.image.data, 'base64')), { width: 390, height: 844 })
  })

  it('busy page times out but still answers', async () => {
    const res = await inspect('/test/resources/test-busy.html')
    assert.equal(res.status, 200)
    assert.equal(res.data.report.ready, 'timeout')
    assert.equal(res.data.report.verdict, 'timeout')
    assert.ok(res.data.image.data.length > 0)
    assert.match(res.data.text, /- Ready: timeout after \d+ ms/)
  })

  it('login redirect is unauthenticated', async () => {
    const res = await inspect('/test/resources/test-login-redirect.html')
    assert.equal(res.status, 200)
    assert.equal(res.data.report.verdict, 'unauthenticated')
    assert.ok(new URL(res.data.report.finalUrl).pathname.startsWith('/simple-directory/login'))
  })

  it('reports cross-host frames', async () => {
    const res = await inspect('/test/resources/test-frame.html')
    assert.equal(res.status, 200)
    assert.deepEqual(res.data.report.blockedFrames, [`http://127.0.0.1:${config.port}`])
    assert.ok(!res.data.report.snapshot.includes('Test page 1'), 'cross-host frame content must not be in the snapshot')
    assert.equal(res.data.report.verdict, 'errors')
    assert.match(res.data.text, /\[BLOCKED\] cross-host frame not rendered/)
  })

  it('a healthy page is ok, without console noise', async () => {
    const res = await inspect('/test/resources/test-clean.html')
    assert.equal(res.status, 200)
    assert.equal(res.data.report.verdict, 'ok', res.data.text)
    assert.deepEqual(res.data.report.consoleErrors, [])
  })

  it('the main frame leaving the target host is an error', async () => {
    const res = await inspect('/test/resources/test-other-host.html')
    assert.equal(res.status, 200)
    assert.equal(new URL(res.data.report.finalUrl).hostname, '127.0.0.1')
    assert.equal(res.data.report.verdict, 'errors')
    assert.match(res.data.text, new RegExp(`- Note: navigated away from localhost:${config.port} to 127\\.0\\.0\\.1:${config.port}\n`))
  })

  it('one huge text does not empty the snapshot', async () => {
    const res = await inspect('/test/resources/test-long-text.html')
    assert.equal(res.status, 200)
    const snapshot: string = res.data.report.snapshot
    assert.ok(snapshot.includes('Head of the page'))
    assert.ok(snapshot.includes('After the long text'))
    assert.ok(snapshot.length < 5000)
    assert.ok(snapshot.includes('…'))
    assert.ok(!snapshot.includes('# snapshot truncated'))
  })

  it('bounds the console and network sections', async () => {
    const res = await inspect('/test/resources/test-many-errors.html')
    assert.equal(res.status, 200)
    const text: string = res.data.text
    const consoleSection = text.slice(text.indexOf('### Console'), text.indexOf('### Snapshot'))
    assert.ok(consoleSection.length <= 8000, `console section is ${consoleSection.length} chars`)
    assert.match(consoleSection, /# console and network truncated: \d+ more lines\n$/)
    assert.ok(text.length < 28000)
  })

  it('full page is clipped to 3000px', async () => {
    const res = await inspect('/test/resources/test-big.html', { fullPage: 'true' })
    assert.equal(res.status, 200)
    assert.deepEqual(await pngSize(Buffer.from(res.data.image.data, 'base64')), { width: 1280, height: 3000 })
  })

  it('refuses without the secret', async () => {
    assert.equal((await inspect('/test/resources/test1.html', {}, {})).status, 401)
    assert.equal((await inspect('/test/resources/test1.html', {}, { 'x-secret-key': 'wrong' })).status, 401)
  })

  it('refuses a forwarded request', async () => {
    const res = await inspect('/test/resources/test1.html', {}, { 'x-secret-key': key, 'x-forwarded-host': 'example.com' })
    assert.equal(res.status, 421)
  })

  it('refuses a non http target', async () => {
    const res = await ax.get('inspect', { params: { target: 'file:///etc/passwd' }, headers: { 'x-secret-key': key } })
    assert.equal(res.status, 400)
  })

  it('cuts long bodies', async () => {
    // a page served by a separate server so that it can answer a long 404 body, the Host header
    // makes capture consider it as its own host
    const other = http.createServer((req, res) => {
      if (req.url === '/page') {
        res.setHeader('content-type', 'text/html')
        res.end('<html><body><script>fetch("/long").finally(() => window.triggerCapture && window.triggerCapture())</script></body></html>')
      } else {
        res.statusCode = 404
        res.setHeader('content-type', 'text/plain')
        res.end('x'.repeat(5000))
      }
    })
    await new Promise<void>(resolve => other.listen(0, '127.0.0.1', resolve))
    const port = (other.address() as any).port
    try {
      const host = `127.0.0.1:${port}`
      const res = await ax.get('inspect', { params: { target: `http://${host}/page` }, headers: { 'x-secret-key': key, host } })
      assert.equal(res.status, 200)
      const failed = res.data.report.failedRequests.find((f: any) => f.path === '/long')
      assert.ok(failed.body.length > 0)
      assert.ok(failed.body.length <= 300)
    } finally {
      other.close()
    }
  })
})
