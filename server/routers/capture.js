const config = require('config')
const express = require('express')
const debug = require('debug')('capture')
const URL = require('url').URL
const jimp = require('jimp')
const asyncWrap = require('../utils/async-wrap')
const headerFooter = require('../utils/header-footer')
const pageUtils = require('../utils/page')
const animationUtils = require('../utils/animation')
const { createTimer } = require('../utils/timer')

const router = exports.router = express.Router()

async function auth(req, res, next) {
  if (!req.app.get('session')) {
    // console.error('WARNING: It is recommended to define directoryUrl parameter')
  } else {
    await req.app.get('session').auth(req, res, () => {})
    if (!req.user && req.query.key !== config.secretKeys.capture) return res.status(401).send()
  }

  if (!req.query.target) return res.status(400).send('parameter "target" is required')
  const target = req.query.target

  // transmit cookies from incoming query if we target and the current service are on same host
  let sameHost
  const captureHost = config.trustHeaderHost ? req.headers.host : new URL(config.publicUrl).host
  try {
    sameHost = new URL(target).host === captureHost
  } catch (err) {
    return res.status(400).send('Failed to parse url ' + err.message)
  }
  if (!sameHost && config.onlySameHost) {
    debug(`[${target}] NOT on same host as capture service (${captureHost}), reject`)
    return res.status(400).send('Only same host targets are accepted')
  }

  if (sameHost && req.cookies && Object.keys(req.cookies).length && req.query.cookies !== 'false') {
    debug(`[${target}] transmit cookies`, Object.keys(req.cookies))
    req.cookies = Object.keys(req.cookies).map(name => ({ name, value: req.cookies[name], url: target }))
  } else {
    debug(`[${target}] do not transmit cookies`)
    delete req.cookies
  }
  next()
}

router.get('/screenshot', asyncWrap(auth), asyncWrap(async (req, res, next) => {
  const target = req.query.target
  debug(`[${target}] capture screenshot`)
  const timer = createTimer(req.originalUrl)

  // read query params
  let width, height
  try {
    width = req.query.width ? parseInt(req.query.width) : 800
    height = req.query.height && req.query.height !== 'auto' ? parseInt(req.query.height) : 450
  } catch (err) {
    return res.status(400).send(err.message)
  }
  if (req.query.height === 'auto') height = Math.round(width / 10)
  if (width > 3000) return res.status(400).send('width too large')
  if (height > 3000) return res.status(400).send('height too large')
  let type = req.query.type
  if (!type && req.query.filename && req.query.filename.endsWith('.gif')) type = 'gif'
  if (!type && req.query.filename && (req.query.filename.endsWith('.jpeg') || req.query.filename.endsWith('.jpg'))) type = 'jpg'
  if (!type) type = 'png'
  timer.type = type

  const { page, animationActivated } = await pageUtils.open(
    target,
    req.query.lang,
    req.query.timezone,
    req.cookies,
    { width, height },
    type === 'gif',
    (config.trustHeaderHost ? req.headers.host : new URL(config.publicUrl).host),
    timer
  )

  debug(`[${target}] page is opened`)
  try {
    if (animationActivated) {
      debug(`take gif screenshot ${target}`)
      const buffer = await animationUtils.capture(target, page, width, height, res)
      timer.step('capture-animation')
      timer.type = 'gif'
      res.type('gif')
      if (req.query.filename) res.attachment(req.query.filename.replace('.png', '.gif'))
      res.send(buffer)
    } else {
      let buffer
      await Promise.race([
        page.screenshot({ fullPage: req.query.height === 'auto' }).then(b => { buffer = b }),
        new Promise(resolve => setTimeout(resolve, config.screenshotTimeout))
      ])
      if (buffer) {
        timer.step('screenshot')
      } else {
        timer.step('screenshot-timeout')
        throw new Error(`Failed to take screenshot of page "${target}" before timeout`)
      }
      debug(`[${target}] png screenshot is taken`)
      timer.type = 'png'
      if (type === 'jpg') {
        debug(`[${target}] convert png screenshot to jpg`)
        const image = await jimp.read(buffer)
        image.quality(90)
        buffer = await image.getBufferAsync(jimp.MIME_JPEG)
        timer.step('convert-jpg')
      }
      if (req.query.timer === 'true') {
        res.send(timer.times)
      } else {
        res.type(type)
        if (req.query.filename) res.attachment(req.query.filename.replace('.gif', '.' + type))
        res.send(buffer)
      }
    }
  } finally {
    await pageUtils.close(page, req.cookies)
    timer.step('close-page')
  }
  timer.finish()
}))

router.get('/print', asyncWrap(auth), asyncWrap(async (req, res, next) => {
  const target = req.query.target
  debug(`[${target}] print page`)

  // read query params
  const type = req.query.type || 'pdf'
  if (!['html', 'pdf'].includes(type)) return res.status(400).send('supported types are "pdf" and "html"')

  const timer = createTimer(req.originalUrl, type)

  const { page } = await pageUtils.open(
    target,
    req.query.lang,
    req.query.timezone,
    req.cookies,
    null,
    false,
    (config.trustHeaderHost ? req.headers.host : new URL(config.publicUrl).host),
    timer
  )
  debug(`[${target}] page is opened`)
  try {
    if (type === 'pdf') {
      const landscape = req.query.landscape === 'true'
      const showFooter = !!req.query.footer
      const footer = req.query.footer === 'true' ? '' : req.query.footer
      const pageRanges = req.query.pageRanges || ''
      const format = req.query.format || 'A4'
      const left = req.query.left || '1.5cm'
      const right = req.query.right || '1.5cm'
      const top = req.query.top || '1.5cm'
      const bottom = req.query.bottom || '1.5cm'
      const pdfOptions = { landscape, pageRanges, format, margin: { left, right, top, bottom }, printBackground: true }
      if (showFooter) {
        pdfOptions.displayHeaderFooter = true
        pdfOptions.headerTemplate = ' '
        pdfOptions.footerTemplate = headerFooter.footer(footer)
      }
      let buffer
      await Promise.race([
        page.pdf(pdfOptions).then(b => { buffer = b }),
        new Promise(resolve => setTimeout(resolve, config.screenshotTimeout))
      ])
      if (!buffer) throw new Error(`Failed to make PDF print of page "${target}" before timeout`)
      timer.step('print-pdf')
      debug(`[${target}] PDF print is taken`)
      res.type('pdf')
      if (req.query.filename) res.attachment(req.query.filename)
      res.send(buffer)
    } else if (type === 'html') {
      let buffer
      await Promise.race([
        page.content().then(b => { buffer = b }),
        new Promise(resolve => setTimeout(resolve, config.screenshotTimeout))
      ])
      if (!buffer) throw new Error(`Failed to make HTML print of page "${target}" before timeout`)
      timer.step('print-html')
      debug(`[${target}] HTML print is taken`)
      if (req.query.filename) res.attachment(req.query.filename)
      res.send(buffer.toString())
    }
  } finally {
    await pageUtils.close(page, req.cookies)
    timer.step('close-page')
  }
  timer.finish()
}))
