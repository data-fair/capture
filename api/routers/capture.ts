import express, { type NextFunction, type Request, type Response } from 'express'
import debugModule from 'debug'
import * as headerFooter from '../utils/header-footer.ts'
import * as pageUtils from '../utils/page.ts'
import * as animationUtils from '../utils/animation.ts'
import { createTimer } from '../utils/timer.ts'
import config from '#config'
import { httpError, reqHost, reqSession } from '@data-fair/lib-express'
import type { PaperFormat, PDFOptions } from 'puppeteer'

const debug = debugModule('capture')

export const router = express.Router()

async function auth (req: Request, res: Response, next: NextFunction) {
  const user = config.privateDirectoryUrl && reqSession(req).user
  if (!user && req.query.key !== config.secretKeys.capture) return res.status(401).send()

  const target = req.query.target
  if (typeof target !== 'string') return res.status(400).send('parameter "target" is required')

  let securedSameHost = false
  if (config.onlySameHost) {
    const captureHost = reqHost(req)
    try {
      securedSameHost = new URL(target).host === captureHost
    } catch (err: any) {
      return res.status(400).send('Failed to parse url ' + err.message)
    }
    if (!securedSameHost) {
      debug(`[${target}] NOT on same host as capture service (${captureHost}), reject`)
      return res.status(400).send('Only same host targets are accepted')
    }
  }

  if (securedSameHost && req.cookies && Object.keys(req.cookies).length && req.query.cookies !== 'false') {
    debug(`[${target}] transmit cookies`)
    req.cookies = Object.keys(req.cookies).map(name => ({ name, value: req.cookies[name], url: target }))
  } else {
    debug(`[${target}] do not transmit cookies`)
    delete req.cookies
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
        const buffer = await animationUtils.capture(target, page, width, height, res)
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
