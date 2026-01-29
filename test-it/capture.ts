import assert from 'assert/strict'
import config from '../api/config.ts'
import { PDFParse } from 'pdf-parse'
import { Jimp } from 'jimp'
import * as server from '../api/server.ts'
import axios from 'axios'
import { describe, before, after, it } from 'node:test'

const ax = axios.create({ baseURL: 'http://localhost:5607/api/v1/' })

const target = 'http://localhost:5607/test/resources/test1.html'
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
    let img = await Jimp.read(res.data)
    assert.equal(img.bitmap.width, 800)
    assert.equal(img.bitmap.height, 450)

    res = await ax.get('screenshot', { params: { key, target, width: '1600' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    const size2 = Number(res.headers['content-length'])
    assert.ok(size2 > size1)
    img = await Jimp.read(res.data)
    assert.equal(img.bitmap.width, 1600)
    assert.equal(img.bitmap.height, 450)

    res = await ax.get('screenshot', { params: { key, target, width: '1600', height: 'auto' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    img = await Jimp.read(res.data)
    assert.equal(img.bitmap.width, 1600)
    assert.ok(img.bitmap.height > 880)
    assert.ok(img.bitmap.height < 890)

    res = await ax.get('screenshot', { params: { key, target, filename: 'screenshot.png' } })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-disposition'], 'attachment; filename="screenshot.png"')
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
    const res = await ax.get('print', { params: { key, target: 'http://localhost:5607/test/resources/test-timeout.html' }, responseType: 'arraybuffer' })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'application/pdf')
    const content = await new PDFParse(new Uint8Array(res.data)).getText()
    assert.ok(content.text.includes('count:3') || content.text.includes('count:4') || content.text.includes('count:5'), content.text)
  })

  it('make animated gif screenshot of a page', async () => {
    let res = await ax.get('screenshot', { params: { key, target: 'http://localhost:5607/test/resources/test-anim.html', type: 'gif' } })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/gif')
    const size1 = Number(res.headers['content-length'])
    assert.ok(size1 < 100000)

    res = await ax.get('screenshot', { params: { key, target: 'http://localhost:5607/test/resources/test-anim.html', filename: 'test.gif' } })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/gif')
    assert.equal(res.headers['content-disposition'], 'attachment; filename="test.gif"')

    res = await ax.get('screenshot', { params: { key, target: 'http://localhost:5607/test/resources/test-anim.html' } })
    assert.equal(res.status, 200)
    assert.equal(res.headers['content-type'], 'image/png')
    const size2 = Number(res.headers['content-length'])
    assert.ok(size2 < 15000)
  })

  it('apply ONLY_SAME_HOST policy to iframes also', async () => {
    // config.onlySameHost = true
    await assert.rejects(
      ax.get('screenshot', { params: { key, target: 'http://localhost:5607/test/resources/test-iframe.html', type: 'pdf' } }),
      (err: any) => err.response.status === 400
    )
    // config.onlySameHost = false
  })
})
