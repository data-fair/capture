import assert from 'assert/strict'
import { PDFParse } from 'pdf-parse'
import { promisify } from 'node:util'
import getPixelsCb from 'get-pixels'
import * as server from '../api/server.ts'
import axios from 'axios'
import { describe, before, after, it } from 'node:test'
import config from '#config'

// get-pixels returns an ndarray shaped [width, height, channels]
const getPixels = promisify(getPixelsCb)
const pngSize = async (data: ArrayBuffer) => {
  const [width, height] = (await getPixels(Buffer.from(data), 'image/png')).shape
  return { width, height }
}

const origin = `http://localhost:${config.port}`
const ax = axios.create({ baseURL: `${origin}/api/v1/` })

const target = origin + '/test/resources/test1.html'
const key = 'capture'

describe('capture', () => {
  before(async function () {
    await server.start()
  })
  after(async () => {
    await server.stop()
  })

  it('make a few screenshot of a page', async () => {
    let res = await ax.get('screenshot', { params: { key, target }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/png')
    const size1 = Number(res.headers['content-length'])
    let img = await pngSize(res.data)
    assert.equal(img.width, 800)
    assert.equal(img.height, 450)

    res = await ax.get('screenshot', { params: { key, target, width: '1600' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    const size2 = Number(res.headers['content-length'])
    assert.ok(size2 > size1)
    img = await pngSize(res.data)
    assert.equal(img.width, 1600)
    assert.equal(img.height, 450)

    res = await ax.get('screenshot', { params: { key, target, width: '1600', height: 'auto' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    img = await pngSize(res.data)
    assert.equal(img.width, 1600)
    assert.ok(img.height > 880)
    assert.ok(img.height < 890)

    res = await ax.get('screenshot', { params: { key, target, filename: 'screenshot.png' } })
    assert.equal(res.status, 200)
    // content-disposition 2 (express 5.3) only quotes filenames that need it
    assert.equal(res.headers['content-disposition'], 'attachment; filename=screenshot.png')
  })

  it('return jpeg images, and png ones when a gif is asked from a page without animation', async () => {
    let res = await ax.get('screenshot', { params: { key, target, type: 'jpg', filename: 'screenshot.jpg' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/jpeg')
    assert.equal(res.headers['content-disposition'], 'attachment; filename=screenshot.jpg')
    assert.deepEqual([...new Uint8Array(res.data).subarray(0, 3)], [0xff, 0xd8, 0xff])

    // test1.html calls triggerCapture() without declaring animation support
    res = await ax.get('screenshot', { params: { key, target, type: 'gif', filename: 'screenshot.gif' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/png')
    assert.equal(res.headers['content-disposition'], 'attachment; filename=screenshot.png')
    assert.equal(Buffer.from(res.data).subarray(1, 4).toString(), 'PNG')
  })

  it('wait for a page without triggerCapture to settle', async () => {
    const settleTarget = origin + '/test/resources/test-settle.html'
    const res = await ax.get('print', { params: { key, target: settleTarget, type: 'html' } })
    assert.equal(res.status, 200)
    assert.ok(res.data.includes('animation done'), 'the capture was taken before the end of the animation')

    const times = (await ax.get('screenshot', { params: { key, target: origin + '/test/resources/test-clean.html', timer: 'true' } })).data
    assert.ok('wait1-network-idle' in times)
    assert.ok('wait2-settle' in times)
  })

  it('isolate captures from each other: nothing is left in the storages of the page', async () => {
    const storageTarget = origin + '/test/resources/test-storage.html'
    // sequential captures, so that a reused browser context would be reused here
    for (const mark of ['user-a', 'user-b', 'user-c']) {
      const res = await ax.get('print', { params: { key, target: storageTarget + '?mark=' + mark, type: 'html' } })
      assert.equal(res.status, 200)
      assert.ok(res.data.includes('previous=null'), `a previous capture left a mark: ${res.data.match(/previous=[^<]*/)?.[0]}`)
    }
  })

  it('drop the captures of clients that left', async () => {
    // more abandoned captures than browser contexts (concurrency 5) of a page that is never idle,
    // each would hold a context for the whole screenshot timeout (2s in tests)
    const busyTarget = origin + '/test/resources/test-busy.html'
    const abandoned = []
    for (let i = 0; i < 15; i++) {
      abandoned.push(ax.get('screenshot', { params: { key, target: busyTarget }, timeout: 300 }).catch(err => err.code))
    }
    assert.ok((await Promise.all(abandoned)).every(code => code === 'ECONNABORTED'))
    // 3 rounds of 5 abandoned captures would delay this one by ~6s if they were rendered
    const t0 = Date.now()
    const res = await ax.get('screenshot', { params: { key, target }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    assert.ok(Date.now() - t0 < 3500, `the capture waited ${Date.now() - t0}ms behind abandoned ones`)
  })

  it('make a few prints of a page', async () => {
    let res = await ax.get('print', { params: { key, target }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'application/pdf')
    let content = await new PDFParse(new Uint8Array(res.data)).getText()
    assert.ok(content.text.includes('Test page 1'))
    assert.ok(content.text.includes('["fr-FR","fr"]'))

    res = await ax.get('print', { params: { key, target, lang: 'es' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    content = await new PDFParse(new Uint8Array(res.data)).getText()
    assert.ok(content.text.includes('["es"]'))

    res = await ax.get('print', { params: { key, target, footer: 'My footer' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    content = await new PDFParse(new Uint8Array(res.data)).getText()
    assert.ok(content.text.includes('My footer'))

    res = await ax.get('print', { params: { key, target }, headers: { cookie: 'id_token=my_token' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    content = await new PDFParse(new Uint8Array(res.data)).getText()
    assert.ok(content.text.includes('id_token=my_token'))

    res = await ax.get('print', { params: { key, target, cookies: false }, headers: { cookie: 'id_token=my_token' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    content = await new PDFParse(new Uint8Array(res.data)).getText()
    assert.equal(content.text.includes('id_token=my_token'), false)

    res = await ax.get('print', { params: { key, target }, headers: { cookie: '' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    content = await new PDFParse(new Uint8Array(res.data)).getText()
    assert.equal(content.text.includes('id_token=my_token'), false)
  })

  it('make concurrent prints with separate contexts', async () => {
    const t0 = new Date().getTime()
    const nb = 20
    const promises = []
    for (let i = 0; i < nb; i++) {
      // cookie only on a part of the captures, so that we make sure that they do not inherit cookies from previous pages
      const cookie = i % 2 === 0 ? `id_token=-footer ${i}-` : null
      promises.push(
        ax.get('print', { params: { key, target, footer: `>footer ${i}<` }, headers: { cookie }, responseType: 'arraybuffer' })
      )
    }
    const responses = await Promise.all(promises)
    for (let i = 0; i < nb; i++) {
      const res = responses[i]
      assert.equal(res.status, 200)
      assert.equal(res.headers['content-type'], 'application/pdf')
      const content = await new PDFParse(new Uint8Array(res.data)).getText()
      assert.ok(content.text.includes('Test page 1'))
      assert.ok(content.text.includes(`>footer ${i}<`))
      if (i % 2 === 0) {
        assert.ok(content.text.includes(`id_token=-footer ${i}-`))
      } else {
        assert.ok(!content.text.includes('id_token='))
      }
    }
    const t1 = new Date().getTime()
    console.log(`${nb} prints in ${t1 - t0}ms`)
  })

  it('make concurrent prints in public contexts', async () => {
    const t0 = new Date().getTime()
    const nb = 20
    const promises = []
    for (let i = 0; i < nb; i++) {
      promises.push(
        ax.get('print', { params: { key, target, footer: `>footer ${i}<` }, responseType: 'arraybuffer' })
      )
    }
    const responses = await Promise.all(promises)
    for (let i = 0; i < nb; i++) {
      const res = responses[i]
      assert.equal(res.status, 200)
      assert.equal(res.headers['content-type'], 'application/pdf')
      const content = await new PDFParse(new Uint8Array(res.data)).getText()
      assert.ok(content.text.includes('Test page 1'))
      assert.ok(content.text.includes(`>footer ${i}<`))
    }
    const t1 = new Date().getTime()
    console.log(`${nb} prints in ${t1 - t0}ms`)
  })

  it('make prints of a page that is never idle', async () => {
    const res = await ax.get('print', { params: { key, target: origin + '/test/resources/test-timeout.html' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'application/pdf')
    const content = await new PDFParse(new Uint8Array(res.data)).getText()
    assert.ok(content.text.includes('count:3') || content.text.includes('count:4') || content.text.includes('count:5'), content.text)
  })

  it('make animated gif screenshot of a page', async () => {
    let res = await ax.get('screenshot', { params: { key, target: origin + '/test/resources/test-anim.html', type: 'gif' } })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/gif')
    const size1 = Number(res.headers['content-length'])
    assert.ok(size1 < 100000)

    // a small gif is encoded in a slice of the Buffer pool of the worker, it must be returned anyway
    res = await ax.get('screenshot', { params: { key, target: origin + '/test/resources/test-anim.html', type: 'gif', width: 100, height: 50 }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/gif')
    assert.equal(Buffer.from(res.data).subarray(0, 3).toString(), 'GIF')

    res = await ax.get('screenshot', { params: { key, target: origin + '/test/resources/test-anim.html', filename: 'test.gif' } })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/gif')
    assert.equal(res.headers['content-disposition'], 'attachment; filename=test.gif')

    res = await ax.get('screenshot', { params: { key, target: origin + '/test/resources/test-anim.html' } })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/png')
    const size2 = Number(res.headers['content-length'])
    assert.ok(size2 < 15000)
  })

  it('apply ONLY_SAME_HOST policy to iframes also', async () => {
    // config.onlySameHost = true
    await assert.rejects(
      ax.get('screenshot', { params: { key, target: origin + '/test/resources/test-iframe.html', type: 'pdf' } }),
      (err: any) => err.response.status === 400
    )
    // config.onlySameHost = false
  })
})
