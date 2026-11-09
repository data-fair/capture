import type { BrowserContext, Page } from 'puppeteer'

// A copy of the capture service's page lifecycle (api/utils/page.ts) with each lever made a
// parameter. Kept in sync by hand: the point is to measure the variants, not to import the
// service with its config.

export type WaitStrategy =
  | 'current' // goto networkidle0 raced with triggerCapture, 2 meta lookups, then +1s
  | 'idle0' // same without the final 1s
  | 'idle0-raf' // same, the 1s replaced by 2 animation frames
  | 'idle0-300' // same, the 1s replaced by 300ms
  | 'idle200-raf' // goto 'load', then a 200ms network idle, then 2 animation frames
  | 'idle500-raf' // goto 'load', then a 500ms network idle (puppeteer side), then 2 animation frames
  | 'idle500-500' // goto 'load', then a 500ms network idle, then a fixed 500ms settle
  | 'quiet' // goto 'load', a 500ms network idle, then visual quiet (see waitForQuiet), capped
  | 'idle2' // goto networkidle2 (<= 2 connections for 500ms), then +1s
  | 'reference' // 'current' + 3s: a page surely settled, the reference of the real pages comparison

// the visual quiet of the 'quiet' strategy: no DOM mutation, no animation frame callback, no
// running finite CSS/Web animation and no font loading for quietMs, or maxMs elapsed
export const quietOptions = { quietMs: 200, maxMs: 2000 }

// injected before any script of the page: records the last time the page did visible work
const installActivityTracker = () => {
  const w = window as any
  w.__captureLastActivity = performance.now()
  const mark = () => { w.__captureLastActivity = performance.now() }
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => raf((t) => { mark(); cb(t) })
  new MutationObserver(mark).observe(document, { subtree: true, childList: true, attributes: true, characterData: true })
}

export const waitForQuiet = (page: Page, quietMs = quietOptions.quietMs, maxMs = quietOptions.maxMs) => page.evaluate((quietMs, maxMs) => new Promise<string>(resolve => {
  const start = performance.now()
  const check = () => {
    const now = performance.now()
    const busy = []
    if (now - ((window as any).__captureLastActivity ?? 0) < quietMs) busy.push('activity')
    // endless animations (spinners, pulses) never settle, they are not waited for
    if (document.getAnimations().some(a => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity)) busy.push('animations')
    if (document.fonts.status === 'loading') busy.push('fonts')
    if (!busy.length) return resolve('quiet')
    if (now - start >= maxMs) return resolve('cap:' + busy.join('+'))
    setTimeout(check, 50)
  }
  check()
}), quietMs, maxMs)

export type SetupOptions = {
  lang?: string,
  timezone?: string,
  consoleListener?: boolean, // the debugPage listener, attached whether DEBUG is set or not
  interception?: boolean // setRequestInterception, as /inspect does
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const setupPage = async (page: Page, opts: SetupOptions = {}) => {
  const lang = opts.lang ?? 'fr-FR'
  await page.emulateTimezone(opts.timezone ?? 'Europe/Paris')
  await page.setExtraHTTPHeaders({ 'Accept-Language': lang })
  await page.evaluateOnNewDocument((lang) => {
    const langs = [lang]
    if (lang.includes('-')) langs.push(lang.split('-')[0])
    Object.defineProperty(navigator, 'language', { get: () => lang })
    Object.defineProperty(navigator, 'languages', { get: () => langs })
  }, lang)
  if (opts.consoleListener) {
    page.on('console', async msg => {
      const args = []
      for (const arg of msg.args()) {
        try {
          args.push((await (await arg.getProperty('message')).jsonValue()) || await arg.jsonValue())
        } catch {}
      }
    })
  }
  if (opts.interception) {
    await page.setRequestInterception(true)
    page.on('request', request => { request.continue().catch(() => {}) })
  }
}

export type WaitResult = { ready: 'triggered' | 'idle' | 'timeout', done: boolean, meta?: string, quiet?: string }

export const gotoAndWait = async (page: Page, url: string, strategy: WaitStrategy, timeout = 20000): Promise<WaitResult> => {
  let triggered = false
  const triggerCapture = new Promise<void>(resolve => {
    page.exposeFunction('triggerCapture', (animationSupported?: boolean) => {
      triggered = true
      resolve()
      return !!animationSupported
    }).catch(() => {})
  })
  if (strategy === 'quiet') await page.evaluateOnNewDocument(installActivityTracker)
  const puppeteerIdle = ['idle200-raf', 'idle500-raf', 'idle500-500', 'quiet'].includes(strategy)
  let ready: WaitResult['ready'] = 'idle'
  try {
    if (puppeteerIdle) {
      const idleTime = strategy === 'idle200-raf' ? 200 : 500
      await Promise.race([
        page.goto(url, { waitUntil: 'load', timeout }).then(() => page.waitForNetworkIdle({ idleTime, timeout })),
        triggerCapture
      ])
    } else {
      const waitUntil = strategy === 'idle2' ? 'networkidle2' : 'networkidle0'
      await Promise.race([page.goto(url, { waitUntil, timeout }), triggerCapture])
    }
  } catch (err: any) {
    if (err.name !== 'TimeoutError') throw err
    ready = 'timeout'
  }
  if (triggered) ready = 'triggered'
  let meta: string | undefined
  let quiet: string | undefined
  if (ready === 'idle') {
    // the 2 metas of the service: an explicit delay, or a promise to call triggerCapture
    const delayMeta = await page.$eval('head > meta[name=\'df:capture-delay\']', el => el.content).catch(() => undefined)
    const captureMeta = delayMeta ? undefined : await page.$eval('head > meta[name=\'x-capture\']', el => el.content).catch(() => undefined)
    if (delayMeta) {
      meta = 'delay=' + delayMeta
      await Promise.race([triggerCapture, sleep(Math.min(Number(delayMeta) * 1000, timeout))])
    } else if (captureMeta === 'trigger') {
      meta = 'trigger'
      await Promise.race([triggerCapture, sleep(timeout)])
    } else if (strategy === 'current' || strategy === 'idle2') await sleep(1000)
    else if (strategy === 'reference') await sleep(4000)
    else if (strategy === 'idle0-300') await sleep(300)
    else if (strategy === 'idle500-500') await sleep(500)
    else if (strategy === 'quiet') quiet = await waitForQuiet(page)
    else await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    if (triggered) ready = 'triggered'
  }
  const done = await page.evaluate(() => document.body?.dataset.done === '1')
  return { ready, done, meta, quiet }
}

// what the service does after a capture: delete cookies, close the page, give the context back
export const cleanPage = async (page: Page) => {
  const context = page.browserContext()
  const cookies = await context.cookies()
  if (cookies.length) await context.deleteCookie(...cookies)
  await page.close()
}

// a minimal pool, enough to reproduce generic-pool's behaviour of the service (lazy creation,
// reuse of released contexts)
export const createContextPool = (create: () => Promise<BrowserContext>) => {
  const free: BrowserContext[] = []
  return {
    acquire: async () => free.pop() ?? await create(),
    release: (c: BrowserContext) => { free.push(c) },
    drain: async () => { await Promise.all(free.splice(0).map(c => c.close().catch(() => {}))) }
  }
}
