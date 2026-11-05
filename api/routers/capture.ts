import express, { type NextFunction, type Request, type Response } from 'express'
import debugModule from 'debug'
import * as headerFooter from '../utils/header-footer.ts'
import * as pageUtils from '../utils/page.ts'
import * as animationUtils from '../utils/animation.ts'
import { createTimer } from '../utils/timer.ts'
import { createSemaphore } from '../utils/semaphore.ts'
import { createReportCollector } from '../utils/report.ts'
import { reportText } from '../utils/report-text.ts'
import config from '#config'
import { assertReqInternalSecret, httpError, reqHost, reqIsInternal, reqSession } from '@data-fair/lib-express'
import type { PaperFormat, PDFOptions } from 'puppeteer'

const debug = debugModule('capture')

// /inspect renders are expensive, a small number of them run at the same time
const inspectSemaphore = createSemaphore(config.inspectConcurrency)

export const router = express.Router()

async function auth (req: Request, res: Response, next: NextFunction) {
  if (config.privateDirectoryUrl) {
    const user = reqSession(req).user
    if (!user) assertReqInternalSecret(req, config.secretKeys.capture)
  } else {
    if (config.secretKeys.capture) assertReqInternalSecret(req, config.secretKeys.capture)
  }

  const target = req.query.target
  if (typeof target !== 'string') return res.status(400).send('parameter "target" is required')

  let securedSameHost = false

  if (config.onlySameHost) {
    let targetHost
    try {
      targetHost = new URL(target).host
    } catch (err: any) {
      return res.status(400).send('Failed to parse target url ' + err.message)
    }

    // this provides compatibility with old mode where onlySameHost was compared to a single "publicUrl"
    // now we prefer using x-forwarded-host for multi-domain usage
    if (config.publicUrl && reqIsInternal(req)) {
      securedSameHost = targetHost === new URL(config.publicUrl).host
    } else {
      const captureHost = config.useHostHeader ? req.get('host') : reqHost(req)
      securedSameHost = targetHost === captureHost
    }

    if (!securedSameHost) {
      debug(`[${target}] NOT on same host as capture service, reject`)
      return res.status(400).send('Only same host targets are accepted')
    }
  }

  if (securedSameHost && req.cookies && Object.keys(req.cookies).length && req.query.cookies !== 'false') {
    debug(`[${target}] transmit cookies`)
    req.cookies = Object.keys(req.cookies).map(name => ({ name, value: req.cookies[name], url: target })) as any
  } else {
    debug(`[${target}] do not transmit cookies`)
    req.cookies = []
  }
  next()
}

router.get('/screenshot', auth, async (req, res, next) => {
  const target = req.query.target
  if (typeof target !== 'string') throw httpError(400, 'invalid target')
  debug(`[${target}] capture screenshot`)

  const lang = req.query.lang
  if (lang && typeof lang !== 'string') throw httpError(400, 'invalid lang')

  const timezone = req.query.timezone
  if (timezone && typeof timezone !== 'string') throw httpError(400, 'invalid timezone')

  let type
  if (typeof req.query.type === 'string') type = req.query.type
  if (!type && typeof req.query.filename === 'string' && req.query.filename.endsWith('.gif')) type = 'gif'
  if (!type) type = 'png'

  const timer = createTimer(req.originalUrl, type)

  let width, height
  try {
    width = typeof req.query.width === 'string' ? parseInt(req.query.width) : 800
    height = typeof req.query.height === 'string' && req.query.height !== 'auto' ? parseInt(req.query.height) : 450
  } catch (err: any) {
    return res.status(400).send(err.message)
  }
  if (req.query.height === 'auto') height = Math.round(width / 10)
  if (width > 3000) return res.status(400).send('width too large')
  if (height > 3000) return res.status(400).send('height too large')

  await pageUtils.withPage(
    target,
    lang,
    timezone,
    req.cookies,
    { width, height },
    type === 'gif',
    timer,
    `Failed to take screenshot of page "${target}" before timeout`,
    async ({ page, animationActivated }) => {
      debug(`[${target}] page is opened`)
      if (animationActivated) {
        debug(`take gif screenshot ${target}`)
        const buffer = await animationUtils.capture(target, page, width, height)
        timer.step('capture-animation')
        timer.type = 'gif'
        res.type('gif')
        if (typeof req.query.filename === 'string') res.attachment(req.query.filename.replace('.png', '.gif'))
        res.send(buffer)
      } else {
        const buffer = await page.screenshot({ fullPage: req.query.height === 'auto' })
        debug(`[${target}] png screenshot is taken`)
        timer.type = 'png'
        if (req.query.timer === 'true') {
          res.send(timer.times)
        } else {
          res.type(type)
          if (typeof req.query.filename === 'string') res.attachment(req.query.filename.replace('.gif', '.' + type))
          res.send(buffer)
        }
      }
    }
  )
  timer.finish()
})

router.get('/print', auth, async (req, res, next) => {
  const target = req.query.target
  if (typeof target !== 'string') throw httpError(400, 'invalid target')
  debug(`[${target}] print page`)

  const type = typeof req.query.type === 'string' ? req.query.type : 'pdf'
  if (!['html', 'pdf'].includes(type)) return res.status(400).send('supported types are "pdf" and "html"')

  const lang = req.query.lang
  if (lang && typeof lang !== 'string') throw httpError(400, 'invalid lang')

  const timezone = req.query.timezone
  if (timezone && typeof timezone !== 'string') throw httpError(400, 'invalid timezone')

  const timer = createTimer(req.originalUrl, type)

  await pageUtils.withPage(
    target,
    lang,
    timezone,
    req.cookies,
    undefined,
    false,
    timer,
    `Failed to make ${type} print of page "${target}" before timeout`,
    async ({ page }) => {
      debug(`[${target}] page is opened`)
      if (type === 'pdf') {
        const landscape = req.query.landscape === 'true'
        const showFooter = typeof req.query.footer === 'string'
        const footer = (req.query.footer === 'true' || typeof req.query.footer !== 'string') ? '' : req.query.footer
        const pageRanges = typeof req.query.pageRanges === 'string' ? req.query.pageRanges : ''
        const format = (req.query.format && typeof req.query.format === 'string' ? req.query.format : 'A4') as PaperFormat
        const left = req.query.left && typeof req.query.left === 'string' ? req.query.left : '1.5cm'
        const right = req.query.right && typeof req.query.right === 'string' ? req.query.right : '1.5cm'
        const top = req.query.top && typeof req.query.top === 'string' ? req.query.top : '1.5cm'
        const bottom = req.query.bottom && typeof req.query.bottom === 'string' ? req.query.bottom : '1.5cm'
        const pdfOptions: PDFOptions = {
          landscape,
          pageRanges,
          format,
          margin: { left, right, top, bottom },
          printBackground: true
        }
        if (showFooter) {
          pdfOptions.displayHeaderFooter = true
          pdfOptions.headerTemplate = ' '
          pdfOptions.footerTemplate = headerFooter.footer(footer)
        }
        const buffer = await page.pdf(pdfOptions)
        timer.step('print-pdf')
        debug(`[${target}] PDF print is taken`)
        res.type('pdf')
        if (typeof req.query.filename === 'string') res.attachment(req.query.filename)
        res.send(buffer)
      } else if (type === 'html') {
        const buffer = await page.content()
        timer.step('print-html')
        debug(`[${target}] HTML print is taken`)
        if (typeof req.query.filename === 'string') res.attachment(req.query.filename)
        res.send(buffer.toString())
      }
    }
  )
  timer.finish()
})

const desktopViewport = { width: 1280, height: 800 }
const mobileViewport = { width: 390, height: 844, isMobile: true, hasTouch: true }
const maxFullPageHeight = 3000

const viewportDimension = (value: unknown, fallback: number) => {
  if (value === undefined) return fallback
  const parsed = typeof value === 'string' ? parseInt(value) : NaN
  if (!(parsed > 0 && parsed <= 3000)) throw httpError(400, 'invalid width or height')
  return parsed
}

// internal only: used by data-fair and portals so that agents can see what they configured
router.get('/inspect', async (req, res) => {
  assertReqInternalSecret(req, config.secretKeys.capture)

  const target = req.query.target
  if (typeof target !== 'string') throw httpError(400, 'parameter "target" is required')
  let targetUrl
  try {
    targetUrl = new URL(target)
  } catch (err: any) {
    throw httpError(400, 'Failed to parse target url ' + err.message)
  }
  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') throw httpError(400, 'target must be an http or https url')
  debug(`[${target}] inspect`)

  const lang = req.query.lang
  if (lang && typeof lang !== 'string') throw httpError(400, 'invalid lang')
  const timezone = req.query.timezone
  if (timezone && typeof timezone !== 'string') throw httpError(400, 'invalid timezone')

  const mobile = req.query.mobile === 'true'
  const fullPage = req.query.fullPage === 'true'
  const viewport = mobile
    ? mobileViewport
    : { width: viewportDimension(req.query.width, desktopViewport.width), height: viewportDimension(req.query.height, desktopViewport.height) }

  const cookies = Object.keys(req.cookies ?? {}).map(name => ({ name, value: req.cookies[name], url: target })) as any
  const timer = createTimer(req.originalUrl, 'inspect')

  let collector: ReturnType<typeof createReportCollector> | undefined
  await inspectSemaphore.run(() => pageUtils.withPage(
    target,
    lang,
    timezone,
    cookies,
    viewport,
    false,
    timer,
    `Failed to inspect page "${target}" before timeout`,
    async ({ page, ready }) => {
      const report = await collector!.finish(ready)
      let buffer
      if (fullPage) {
        const height = await page.evaluate(() => document.documentElement.scrollHeight)
        buffer = await page.screenshot({ captureBeyondViewport: true, clip: { x: 0, y: 0, width: viewport.width, height: Math.min(height, maxFullPageHeight) } })
      } else {
        buffer = await page.screenshot()
      }
      timer.type = 'inspect'
      res.json({ image: { data: Buffer.from(buffer).toString('base64'), mediaType: 'image/png' }, text: reportText(report), report })
    },
    true,
    page => { collector = createReportCollector(page, target) }
  ))
  timer.finish()
})
