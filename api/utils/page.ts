import config from '#config'
import puppeteer, { type Viewport, type Browser, type BrowserContext, type Page, type CookieData } from 'puppeteer'
import { contextsCleanups } from './metrics.ts'
import debugModule from 'debug'
import log from '@data-fair/lib-node/log.js'
import { Timer } from './timer.ts'
import { httpError } from '@data-fair/lib-express'
import { createSemaphore, SemaphoreError } from './semaphore.ts'
import type { Ready } from './report.ts'

const debug = debugModule('capture')

let _closed = false

let _browser: Browser

// the captures running at the same time, each one in its own incognito context. The others wait
// in a bounded queue (config.queue)
export const captureSlots = createSemaphore(config.concurrency, config.queue)

export const start = async () => {
  log.info('init puppeteer browser', { launchOptions: config.puppeteerLaunchOptions })
  _browser = await puppeteer.launch(config.puppeteerLaunchOptions)

  // auto reconnection, cf https://github.com/GoogleChrome/puppeteer/issues/4428
  // the captures running in the lost browser fail, the next ones use the new browser
  _browser.on('disconnected', async () => {
    if (!_closed) {
      log.error('browser was disconnected, reconnect', { code: 'browser-disconnected' })
      start().catch(err => log.error('failure while restarting the browser', { code: 'browser-restart', err }))
    }
  })
}

export const stop = async () => {
  _closed = true
  if (_browser) await _browser.close()
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
      log.warn('failed to parse a console message of a captured page', { code: 'page-console-parse', url: page.url(), err })
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

// options of the /inspect renders
export type InspectOptions = {
  onPage?: (page: Page) => void,
  // POST requests to this URL (query ignored) are answered by capture itself and never reach the
  // server, their body is handed to onDeclaredError: this is how an application declares an error
  declaredErrorUrl?: string,
  onDeclaredError?: (body: string | undefined) => void
}

const withoutQuery = (url: string) => {
  const parsed = new URL(url)
  parsed.search = ''
  parsed.hash = ''
  return parsed.href
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
  inspect: InspectOptions | undefined
): Promise<OpenPageResult> {
  const reportFrames = !!inspect
  await setPageLocale(page, lang || config.defaultLang, timezone || config.defaultTimezone)
  if (cookies) await page.browserContext().setCookie(...cookies)
  if (viewport) await page.setViewport(viewport)
  const declaredErrorUrl = inspect?.declaredErrorUrl && withoutQuery(inspect.declaredErrorUrl)
  if (reportFrames && (config.onlySameHost || declaredErrorUrl)) {
    // cross-host frames are reported by the collector, but their content must not be loaded
    await page.setRequestInterception(true)
    page.on('request', request => {
      if (request.isInterceptResolutionHandled()) return
      if (declaredErrorUrl && request.method() === 'POST' && URL.canParse(request.url()) && withoutQuery(request.url()) === declaredErrorUrl) {
        // a render must not write anything, the declared error is only reported
        inspect?.onDeclaredError?.(request.postData())
        request.respond({ status: 204 }).catch(() => {})
      } else if (config.onlySameHost && request.isNavigationRequest() && request.frame() !== page.mainFrame() && !isSameHost(request.url(), target)) {
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
  let timer: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve, reject) => { timer = setTimeout(() => reject(new Error(msg)), ms) })
    ])
  } finally {
    clearTimeout(timer)
  }
}

// the client left (proxy timeout, user gone): the render is stopped, nobody would receive it.
// 499 is nginx's "client closed request", below 500 it is not logged as a failure
const clientGone = () => httpError(499, 'client closed the request')

// rejects as soon as the signal aborts, the promise keeps running but its page gets closed
const unlessAborted = async <T>(promise: Promise<T>, signal: AbortSignal | undefined) => {
  if (!signal) return promise
  if (signal.aborted) throw clientGone()
  let onAbort: (() => void) | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve, reject) => {
        onAbort = () => reject(clientGone())
        signal.addEventListener('abort', onAbort, { once: true })
      })
    ])
  } finally {
    if (onAbort) signal.removeEventListener('abort', onAbort)
  }
}

// a full queue or a long wait for a slot mean an overloaded service: better a quick 503 that the
// caller can retry than a response after it has given up
export const slotError = (err: unknown) => {
  if (err instanceof SemaphoreError) {
    if (err.code === 'aborted') return clientGone()
    return httpError(503, 'the capture service is overloaded, retry later')
  }
  return err
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
  inspect?: InspectOptions,
  // aborted when the client closes the request
  signal?: AbortSignal) => {
  if (target.includes('capture-test-error=true')) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    throw new Error('forced error trigger')
  }
  try {
    await captureSlots.run(async () => {
      timer.step('acquire-context')
      // a fresh incognito context per capture, closed after it: nothing of a capture (cookies,
      // localStorage, IndexedDB, cache, service workers) can leak into the next one, whatever
      // the user it is made for. It costs a few milliseconds
      const context = await _browser.createBrowserContext()
      try {
        const page = await context.newPage()
        // the console listener costs 2 CDP round trips per argument of every console message, on
        // the main thread of the service: only paid when the debug output is enabled (DEBUG=capture)
        if (debug.enabled) debugPage(page)
        inspect?.onPage?.(page)
        timer.step('newPage')

        const result = await unlessAborted(promiseTimeout(
          openInPage(page, target, lang, timezone, cookies, viewport, animate, timer, inspect),
          config.screenshotTimeout * 2,
          `Failed to open "${target}" in context before timeout`
        ), signal)
        timer.step('open-in-page')
        await unlessAborted(promiseTimeout(
          callback(result),
          result.animationActivated ? config.screenshotTimeout * 2 : config.screenshotTimeout,
          callbackTimeoutMsg
        ), signal)
      } finally {
        await closeContext(context)
      }
    }, signal)
  } catch (err) {
    throw slotError(err)
  }
  timer.step('close-page')
}

const closeContext = async (context: BrowserContext) => {
  try {
    await promiseTimeout(context.close(), 5000, 'timed out while closing a browser context')
    contextsCleanups.inc()
  } catch (err) {
    // the browser may be gone (disconnected), or stuck: nothing more to do for this capture
    log.warn('failed to close a browser context', { code: 'context-close', err })
  }
}

// injected before any script of the page: records the last time the page did visible work, read
// by waitForQuiet. A copy of benchmark/lib/capture.ts, where the strategy was measured
const installActivityTracker = () => {
  const w = window as any
  w.__captureLastActivity = performance.now()
  const mark = () => { w.__captureLastActivity = performance.now() }
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => raf((t) => { mark(); cb(t) })
  new MutationObserver(mark).observe(document, { subtree: true, childList: true, attributes: true, characterData: true })
}

// resolves when the page has been visually quiet for quietTime (no DOM mutation, no animation frame,
// no running finite animation, no font loading), or after maxSettleTime. Endless animations
// (spinners) are ignored, they never settle
const waitForQuiet = (page: Page) => page.evaluate((quietTime, maxSettleTime) => new Promise<string>(resolve => {
  const start = performance.now()
  const check = () => {
    const now = performance.now()
    const busy = []
    if (now - ((window as any).__captureLastActivity ?? 0) < quietTime) busy.push('activity')
    if (document.getAnimations().some(a => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity)) busy.push('animations')
    if (document.fonts.status === 'loading') busy.push('fonts')
    if (!busy.length) return resolve('quiet')
    if (now - start >= maxSettleTime) return resolve('max settle time, busy with ' + busy.join(' and '))
    setTimeout(check, 50)
  }
  check()
}), config.wait.quietTime, config.wait.maxSettleTime)

// the strategy to wait for the page to be ready for capture.
// the page can explicitly call a triggerCapture function, this is the fast and reliable way.
// otherwise we wait for the network to be idle, then for the page to be visually quiet (cf
// benchmark/FINDINGS.md for the measures behind this strategy)
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
  let settledBy = ''
  const triggerCapture = new Promise<void>(resolve => page.exposeFunction('triggerCapture', (animationSupported?: boolean) => {
    captureTriggered = true
    animationActivated = !!(animate && animationSupported)
    resolve()
    // return animate to the page inside the capture
    return animate
  }))
  await page.evaluateOnNewDocument(installActivityTracker)

  try {
    // wait for network inactivity, but it can be interrupted if triggerCapture is called
    // puppeteer's own network idle: networkidle0 is Chrome's lifecycle event, its idleness
    // detector fires 0.5 to 1.5s after the last request depending on the page's activity
    const deadline = Date.now() + config.screenshotTimeout
    const networkIdle = page.goto(target, { waitUntil: 'load', timeout: config.screenshotTimeout })
      .then(() => page.waitForNetworkIdle({ idleTime: config.wait.networkIdleTime, timeout: Math.max(1, deadline - Date.now()) }))
    // the race may be won by triggerCapture, a later rejection (page closed) must not go unhandled
    networkIdle.catch(() => {})
    await Promise.race([networkIdle, triggerCapture])

    if (captureTriggered) {
      timer.step('wait1-capture-triggered')
      debug(`[${target}] capture was expicitly triggered by window.triggerCapture`)
    } else {
      timer.step('wait1-network-idle')
      debug(`[${target}] network was idle during ${config.wait.networkIdleTime}ms`)
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
        settledBy = `the df:capture-delay meta (${delay}ms)`
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
        // the page may still render after its last response (charts animations, vue rendering..)
        const quiet = await waitForQuiet(page)
        if (captureTriggered) {
          timer.step('wait2-capture-triggered')
        } else {
          timer.step('wait2-settle')
          settledBy = quiet === 'quiet' ? 'network idle then visual quiet' : 'network idle then ' + quiet
          debug(`[${target}] settled: ${settledBy}`)
        }
      }
    }
  }
  if (!captureTriggered) {
    // the heuristics are slower and less reliable than an explicit signal, this guides the
    // applications that should call window.triggerCapture when they are rendered
    log.warn('captured page did not call window.triggerCapture', {
      code: 'capture-no-trigger',
      target,
      settledBy: timeoutReached ? `the timeout (${config.screenshotTimeout}ms)` : settledBy
    })
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
