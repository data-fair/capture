import config from '#config'
import puppeteer, { type Viewport, type Browser, type BrowserContext, type Page, type CookieData } from 'puppeteer'
import genericPool, { type Factory, type Pool } from 'generic-pool'
import { contextsCleanups } from './metrics.ts'
import debugModule from 'debug'
import { Timer } from './timer.ts'
import { httpError } from '@data-fair/lib-express'
import type { Ready } from './report.ts'

const debug = debugModule('capture')

let _closed = false

let _browser: Browser
let _contextPool: Pool<BrowserContext>

export function contextPool () {
  if (!_contextPool) throw new Error('contextPool not initialized')
  return _contextPool
}

export const start = async () => {
  console.log('init puppeteer browser', config.puppeteerLaunchOptions)
  _browser = await puppeteer.launch(config.puppeteerLaunchOptions)
  const contextFactory: Factory<BrowserContext> = {
    async create () {
    // create pages in incognito contexts so that cookies are not shared
    // each context is used sequentially only because of cookies or other states conflicts
      return _browser.createBrowserContext({})
    },
    async destroy (context) {
      await context.close()
    }
  }
  _contextPool = genericPool.createPool(contextFactory, { max: config.concurrency })

  // auto reconnection, cf https://github.com/GoogleChrome/puppeteer/issues/4428
  _browser.on('disconnected', async () => {
    if (!_closed) {
      console.log('Browser was disconnected for some reason, reconnect')
      try {
        await _contextPool.drain()
        _contextPool.clear()
      } catch (err) {
        console.log('Error while draining replaced contexts pool', err)
      }
      exports.start()
    }
  })
}

export const stop = async () => {
  _closed = true
  if (_browser) await _browser.close()
  if (_contextPool) {
    await _contextPool.drain()
    _contextPool.clear()
  }
}

const debugPage = (page: Page) => {
  page.on('console', async msg => {
    try {
      const args = []
      for (const arg of msg.args()) {
        const argStr = (await (await arg.getProperty('message')).jsonValue()) || await arg.jsonValue()
        args.push(argStr)
      }
      if (args.length) debug(`[${page.url()}] console.${msg.type()}: `, ...args)
    } catch (err) {
      console.error(`[${page.url()}] failed to parse console message: ${msg.text()}`, err)
    }
  })
  page.on('pageerror', err => {
    debug(`[${page.url()}] page error: ${err}`)
  })
  page.on('error', err => {
    debug(`[${page.url()}] error: ${err}`)
  })
  page.on('requestfailed', request => {
    debug(`[${page.url()}] requestfailed: ${request.failure()?.errorText} ${request.url()}`)
  })
}

// the host rule of onlySameHost, shared by the frames check and the report collector
export const isSameHost = (url: string, target: string) => {
  try {
    return new URL(url).host === new URL(target).host
  } catch (err) {
    return false
  }
}

type OpenPageResult = {
  page: Page,
  animationActivated: boolean,
  ready: Ready
}

async function openInPage (
  page: Page,
  target: string,
  lang: string | undefined,
  timezone: string | undefined,
  cookies: CookieData[],
  viewport: Viewport | undefined,
  animate: boolean,
  timer: Timer,
  reportFrames: boolean
): Promise<OpenPageResult> {
  await setPageLocale(page, lang || config.defaultLang, timezone || config.defaultTimezone)
  if (cookies) await page.browserContext().setCookie(...cookies)
  if (viewport) await page.setViewport(viewport)
  if (reportFrames && config.onlySameHost) {
    // cross-host frames are reported by the collector, but their content must not be loaded
    await page.setRequestInterception(true)
    page.on('request', request => {
      if (request.isInterceptResolutionHandled()) return
      if (request.isNavigationRequest() && request.frame() !== page.mainFrame() && !isSameHost(request.url(), target)) {
        request.abort('blockedbyclient').catch(() => {})
      } else {
        request.continue().catch(() => {})
      }
    })
  }
  timer.step('configure-page')
  const { animationActivated, ready } = await waitForPage(page, target, animate, timer)

  for (const frame of page.frames()) {
    const frameUrl = frame.url()
    if (!frameUrl) continue
    // the frames are recorded by the report collector instead of failing the request
    if (reportFrames && !/^https?:/.test(frameUrl)) continue
    if (!URL.canParse(frameUrl)) throw httpError(400, 'IFrame with invalid URL :' + frameUrl)
    const sameHost = isSameHost(frameUrl, target)
    if (!sameHost && config.onlySameHost && !reportFrames) {
      debug(`${frameUrl} from iframe in ${target} is NOT on same host, reject`)
      throw httpError(400, 'IFrame did not have same host :' + new URL(frameUrl).host)
    }
  }

  return { page, animationActivated, ready }
}

export const promiseTimeout = async <T>(promise: Promise<T>, ms: number, msg = 'timeout') => {
  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) => setTimeout(() => reject(new Error(msg)), ms))
  ])
}

export const withPage = async (
  target: string,
  lang: string | undefined,
  timezone: string | undefined,
  cookies: CookieData[],
  viewport: Viewport | undefined,
  animate: boolean,
  timer: Timer,
  callbackTimeoutMsg: string,
  callback: (result: OpenPageResult) => Promise<void>,
  reportFrames = false,
  onPage?: (page: Page) => void) => {
  if (target.includes('capture-test-error=true')) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    throw new Error('forced error trigger')
  }
  let context, page, openSuccess
  try {
    debug(`[${target}] use incognito context from pool`)
    let pageAttempts = 0
    while (!page) {
      pageAttempts++
      context = await _contextPool.acquire()
      timer.step('acquire-context')
      try {
        page = await context.newPage()
      } catch (err) {
        if (pageAttempts === config.concurrency) {
          throw err
        } else {
          debug(`[${target}] delete incognito context from pool because it couldn't be used to open a page`)
          await _contextPool.destroy(context)
        }
      }
    }
    debugPage(page)
    onPage?.(page)
    timer.step('newPage')

    const result = await promiseTimeout(
      openInPage(page, target, lang, timezone, cookies, viewport, animate, timer, reportFrames),
      config.screenshotTimeout * 2,
      `Failed to open "${target}" in context before timeout`
    )
    timer.step('open-in-page')
    openSuccess = true
    await promiseTimeout(
      callback(result),
      result.animationActivated ? config.screenshotTimeout * 2 : config.screenshotTimeout,
      callbackTimeoutMsg
    )
  } finally {
    if (page) await safeCleanContext(page, !!openSuccess)
  }
  timer.step('close-page')
}

const cleanContext = async (page: Page) => {
  // always empty cookies to prevent inheriting them in next use of the context
  const context = page.browserContext()
  const cookies = await context.cookies()
  // deleting them in a single call spares one CDP round trip per cookie, and this
  // runs inside a 2s timeout that a session's worth of cookies could otherwise eat
  if (cookies.length) await context.deleteCookie(...cookies)
  await page.close()
}

const safeCleanContext = async (page: Page, openSuccess: boolean) => {
  if (openSuccess) {
    try {
      await promiseTimeout(
        cleanContext(page),
        2000,
        'timed out while cleaning page context'
      )
      await _contextPool.release(page.browserContext())
      contextsCleanups.inc()
    } catch (err) {
      console.error('Failed to clean page properly, do not reuse this context', err)
      await _contextPool.destroy(page.browserContext())
    }
  } else {
    await _contextPool.destroy(page.browserContext())
  }
}

// quite complex strategy to wait for the page to be ready for capture.
// it can either explitly call a triggerCapture function or we wait for idle network + 1s
const waitForPage = async (
  page: Page,
  target: string,
  animate: boolean,
  timer: Timer
): Promise<{ animationActivated: boolean, ready: Ready }> => {
  // Prepare a function that the page can call to signal that it is ready for capture
  let captureTriggered = false
  let timeoutReached = false
  let animationActivated = false
  const triggerCapture = new Promise<void>(resolve => page.exposeFunction('triggerCapture', (animationSupported?: boolean) => {
    captureTriggered = true
    animationActivated = !!(animate && animationSupported)
    resolve()
    // return animate to the page inside the capture
    return animate
  }))

  try {
    // wait for network inactivity, but it can be interrupted if triggerCapture is called
    const waitOptions = { waitUntil: 'networkidle0' as const, timeout: config.screenshotTimeout }
    await Promise.race([page.goto(target, waitOptions), triggerCapture])

    if (captureTriggered) {
      timer.step('wait1-capture-triggered')
      debug(`[${target}] capture was expicitly triggered by window.triggerCapture`)
    } else {
      timer.step('wait1-network-idle')
      debug(`[${target}] network was idle during 500ms`)
    }
  } catch (err: any) {
    if (err.name !== 'TimeoutError') throw err
    else {
      timer.step('wait1-timeout')
      debug(`[${target}] timeout of ${config.screenshotTimeout} was reached`)
      timeoutReached = true
    }
  }

  if (captureTriggered || timeoutReached) {
    // we are done here, capture was already explicitly triggered or we already waited for a long time
  } else {
    // network was found to be idle, adapt the wait strategy based on some meta
    // Adapt the wait strategy based on the x-capture meta

    // Adapt the wait strategy based on the x-capture meta
    let captureDelayMeta
    try {
      captureDelayMeta = await page.$eval('head > meta[name=\'df:capture-delay\']', el => el.content)
    } catch (err) {
      // nothing to do, meta is probably absent
    }
    timer.step('wait2-get-meta1')
    if (captureDelayMeta) {
      const delay = Math.min(Number(captureDelayMeta) * 1000, config.screenshotTimeout)
      await Promise.race([
        triggerCapture,
        new Promise(resolve => setTimeout(resolve, delay))
      ])
      if (captureTriggered) {
        timer.step('wait2-capture-triggered')
        debug(`[${target}] capture was expicitly triggered by window.triggerCapture`)
      } else {
        timer.step('wait2-delay')
        debug(`[${target}] delay of ${delay / 1000} seconds was reached`)
      }
    } else {
      // x-capture is deprecated, kept for retro-compatibility
      let captureMeta
      try {
        captureMeta = await page.$eval('head > meta[name=\'x-capture\']', el => el.content)
      } catch (err) {
        // nothing to do, meta is probably absent
      }
      timer.step('wait2-get-meta2')
      if (captureMeta === 'trigger') {
        debug(`[${target}] wait for explicit window.triggerCapture call after network was found idle`)
        await Promise.race([
          triggerCapture,
          new Promise(resolve => setTimeout(resolve, config.screenshotTimeout))
        ])
        if (captureTriggered) {
          timer.step('wait2-capture-triggered')
          debug(`[${target}] capture was expicitly triggered by window.triggerCapture call`)
        } else {
          timer.step('wait2-timeout')
          debug(`[${target}] timeout of ${config.screenshotTimeout} was reached`)
          timeoutReached = true
        }
      } else {
        debug(`[${target}] wait 1000ms more after idle network for safety`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        timer.step('wait2-1s')
      }
    }
  }
  const ready: Ready = captureTriggered ? 'triggered' : timeoutReached ? 'timeout' : 'idle'
  return { animationActivated, ready }
}

const setPageLocale = async (page: Page, lang: string, timezone: string) => {
  debug(`[${page.url()}] localization lang=${lang}, timezone=${timezone}`)
  await page.emulateTimezone(timezone)
  await page.setExtraHTTPHeaders({
    'Accept-Language': lang
  })
  await page.evaluateOnNewDocument((lang) => {
    const langs = [lang]
    if (lang.includes('-')) langs.push(lang.split('-')[0])
    Object.defineProperty(navigator, 'language', {
      get: function () {
        return lang
      }
    })
    Object.defineProperty(navigator, 'languages', {
      get: function () {
        return langs
      }
    })
  }, lang)
}
