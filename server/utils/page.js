const config = require('config')
const puppeteer = require('puppeteer')
const genericPool = require('generic-pool')
const createError = require('http-errors')
const debug = require('debug')('capture')

const contextFactory = {
  async create() {
    // create pages in incognito contexts so that cookies are not shared
    // each context is used sequentially only because of cookies or other states conflicts
    return _browser.createIncognitoBrowserContext()
  },
  async destroy(context) {
    await context.close()
  }
}
const publicPageFactory = {
  async create() {
    // create pages in incognito contexts so that cookies are not shared
    // each context is used sequentially only because of cookies or other states conflicts
    const page = await _browser.defaultBrowserContext().newPage()
    debugPage(page)
    return page
  },
  async destroy(page) {
    await page.close()
  }
}

const debugPage = (page) => {
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
    debug(`[${page.url()}] requestfailed: ${request.failure().errorText} ${request.url()}`)
  })
}

// start / stop a single puppeteer browser
let _closed, _browser, _contextPool, _publicPagePool
exports.start = async (app) => {
  console.log('init puppeteer browser', config.puppeteerLaunchOptions)
  _browser = await puppeteer.launch(config.puppeteerLaunchOptions)
  _contextPool = exports.contextPool = genericPool.createPool(contextFactory, { min: 1, max: config.concurrency })
  _publicPagePool = exports.publicPagePool = genericPool.createPool(publicPageFactory, { min: 1, max: config.concurrencyPublic !== null ? config.concurrencyPublic : config.concurrency })

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
exports.stop = async () => {
  _closed = true
  if (_browser) await _browser.close()
  if (_contextPool) {
    await _contextPool.drain()
    _contextPool.clear()
  }
}

async function openInPage(page, target, lang, timezone, cookies, viewport, animate, captureHost, timer) {
  await setPageLocale(page, lang || config.defaultLang, timezone || config.defaultTimezone)
  if (cookies) await page.setCookie.apply(page, cookies)
  if (viewport) await page.setViewport(viewport)
  timer.step('configure-page')
  const animationActivated = await waitForPage(page, target, animate, timer)

  for (const frame of page.frames()) {
    const frameUrl = frame.url()
    const sameHost = new URL(frameUrl).host === captureHost
    if (!sameHost && config.onlySameHost) {
      debug(`${frameUrl} from iframe in ${target} is NOT on same host as capture service (${captureHost}), reject`)
      throw createError(400, 'IFrame did not have same host :' + new URL(frameUrl).host)
    }
  }

  return { page, animationActivated }
}

exports.open = async (target, lang, timezone, cookies, viewport, animate, captureHost, timer) => {
  if (target.includes('capture-test-error=true')) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    throw new Error('forced error trigger')
  }
  let context, page
  if (cookies || config.concurrencyPublic === 0) {
    debug(`[${target}] use incognito context from pool`)
    context = await _contextPool.acquire()
    timer.step('acquire-context')
    try {
      page = await context.newPage()
      debugPage(page)
      timer.step('newPage')
    } catch (err) {
      await safeCleanContext(null, cookies, context)
      throw err
    }
  } else {
    debug(`[${target}] use default brower context`)
    page = await _publicPagePool.acquire()
  }
  let result
  try {
    await Promise.race([
      openInPage(page, target, lang, timezone, cookies, viewport, animate, captureHost, timer).then(r => { result = r }),
      new Promise(resolve => setTimeout(resolve, config.screenshotTimeout * 2))
    ])
    if (!result) throw new Error(`Failed to open "${target}" in context before timeout`)
    return result
  } catch (err) {
    await safeCleanContext(page, cookies, context)
    throw err
  }
}

// make sure we always close the page and release the incognito context for next page
exports.close = (page, cookies) => {
  safeCleanContext(page, cookies, page.browserContext())
}

const cleanIncognitoContext = async (page, cookies) => {
  // always empty cookies to prevent inheriting them in next use of the context
  // to be extra sure we delete the cookies that were explicitly passed to page, and check for other cookies that might have been created
  await page.deleteCookie.apply(page, cookies)
  const otherCookies = await page.cookies()
  await page.deleteCookie.apply(page, otherCookies)
  await page.close()
}

const safeCleanContext = async (page, cookies, context) => {
  if (!page) {
    if (context && context.isIncognito()) _contextPool.destroy(context)
    return
  }
  if (context && context.isIncognito()) {
    try {
      let timedout
      await Promise.race([
        await cleanIncognitoContext(page, cookies),
        new Promise(resolve => setTimeout(() => { resolve(); timedout = true }, 2000))
      ])
      if (timedout) throw new Error('timed out while cleaning page context')
      _contextPool.release(context)
    } catch (err) {
      console.error('Failed to clean page properly, do not reuse this context', err)
      _contextPool.destroy(context)
    }
  } else {
    return _publicPagePool.destroy(page)
  }
}

// quite complex strategy to wait for the page to be ready for capture.
// it can either explitly call a triggerCapture function or we wait for idle network + 1s
const waitForPage = async (page, target, animate, timer) => {
  // Prepare a function that the page can call to signal that it is ready for capture
  let captureTriggered = false
  let timeoutReached = false
  let animationActivated = false
  const triggerCapture = new Promise(resolve => page.exposeFunction('triggerCapture', (animationSupported) => {
    captureTriggered = true
    animationActivated = animate && animationSupported
    resolve()
    // return animate to the page inside the capture
    return animate
  }))

  try {
    // wait for network inactivity, but it can be interrupted if triggerCapture is called
    const waitOptions = { waitUntil: 'networkidle0', timeout: config.screenshotTimeout }
    await Promise.race([ page.goto(target, waitOptions), triggerCapture ])

    if (captureTriggered) {
      timer.step('wait1-capture-triggered')
      debug(`[${target}] capture was expicitly triggered by window.triggerCapture`)
    } else {
      timer.step('wait1-network-idle')
      debug(`[${target}] network was idle during 500ms`)
    }
  } catch (err) {
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
      captureDelayMeta = await page.$eval(`head > meta[name='df:capture-delay']`, el => el.content)
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
        captureMeta = await page.$eval(`head > meta[name='x-capture']`, el => el.content)
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
        }
      } else {
        debug(`[${target}] wait 1000ms more after idle network for safety`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        timer.step('wait2-1s')
      }
    }
  }
  return animationActivated
}

const setPageLocale = async (page, lang, timezone) => {
  debug(`[${page.url()}] localization lang=${lang}, timezone=${timezone}`)
  await page.emulateTimezone(timezone)
  await page.setExtraHTTPHeaders({
    'Accept-Language': lang
  })
  await page.evaluateOnNewDocument((lang) => {
    const langs = [lang]
    if (lang.includes('-')) langs.push(lang.split('-')[0])
    Object.defineProperty(navigator, 'language', {
      get: function() {
        return lang
      }
    })
    Object.defineProperty(navigator, 'languages', {
      get: function() {
        return langs
      }
    })
  }, lang)
}
