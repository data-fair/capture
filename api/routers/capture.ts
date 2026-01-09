import express from 'express'
import debug from 'debug'
import jimp from 'jimp'
import { footer } from '../utils/header-footer.ts'
import pageUtils from '../utils/page.ts'
import animationUtils from '../utils/animation.ts'
import { createTimer } from '../utils/timer.ts'
import config from 'config'

export const router = express.Router()

async function auth(req, res, next) {
  if (!req.app.get('session')) {
  } else {
    await req.app.get('session').auth(req, res, () => {})
    if (!req.user && req.query.key !== config.secretKeys.capture) return res.status(401).send()
  }

  if (!req.query.target) return res.status(400).send('parameter "target" is required')
  const target = req.query.target

  let sameHost
  const captureHost = reqHost(req)
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

router.get('/screenshot', auth, async (req, res, next) => {
  const target = req.query.target
  debug(`[${target}] capture screenshot`)
  const timer = createTimer(req.originalUrl)

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

  await pageUtils.withPage(
    target,
    req.query.lang,
    req.query.timezone,
    req.cookies,
    { width, height },
    type === 'gif',
    reqHost(req),
    timer,
    `Failed to take screenshot of page "${target}" before timeout`,
    async ({ page, animationActivated }) => {
      debug(`[${target}] page is opened`)
      if (animationActivated) {
        debug(`take gif screenshot ${target}`)
        const buffer = await animationUtils.capture(target, page, width, height, res)
        timer.step('capture-animation')
        timer.type = 'gif'
        res.type('gif')
        if (req.query.filename) res.attachment(req.query.filename.replace('.png', '.gif'))
        res.send(buffer)
      } else {
        let buffer = await page.screenshot({ fullPage: req.query.height === 'auto' })
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
    }
  )
  timer.finish()
})

router.get('/print', auth, async (req, res, next) => {
  const target = req.query.target
  debug(`[${target}] print page`)

  const type = req.query.type || 'pdf'
  if (!['html', 'pdf'].includes(type)) return res.status(400).send('supported types are "pdf" and "html"')

  const timer = createTimer(req.originalUrl, type)

  await pageUtils.withPage(
    target,
    req.query.lang,
    req.query.timezone,
    req.cookies,
    null,
    false,
    reqHost(req),
    timer,
    `Failed to make ${type} print of page "${target}" before timeout`,
    async ({ page }) => {
      debug(`[${target}] page is opened`)
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
          pdfOptions.footerTemplate = footer(footer)
        }
        const buffer = await page.pdf(pdfOptions)
        timer.step('print-pdf')
        debug(`[${target}] PDF print is taken`)
        res.type('pdf')
        if (req.query.filename) res.attachment(req.query.filename)
        res.send(buffer)
      } else if (type === 'html') {
        const buffer = await page.content()
        timer.step('print-html')
        debug(`[${target}] HTML print is taken`)
        if (req.query.filename) res.attachment(req.query.filename)
        res.send(buffer.toString())
      }
    }
  )
  timer.finish()
})