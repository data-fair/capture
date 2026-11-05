import type { Page } from 'puppeteer'
import config from '#config'
import { ariaSnapshot } from './aria-snapshot.ts'
import { isSameHost } from './page.ts'

export type Ready = 'triggered' | 'idle' | 'timeout'
export type Verdict = 'ok' | 'errors' | 'timeout' | 'unauthenticated'
export type ConsoleEntry = { text: string, url?: string, line?: number }
export type FailedRequest = { method: string, url: string, path: string, status?: number, statusText?: string, errorText?: string, body?: string }
export type RenderReport = {
  url: string,
  finalUrl: string,
  status?: number,
  statusText?: string,
  ready: Ready,
  durationMs: number,
  title: string,
  consoleErrors: ConsoleEntry[],
  consoleWarnings: number,
  pageErrors: string[],
  failedRequests: FailedRequest[],
  blockedFrames: string[],
  snapshot: string,
  verdict: Verdict
}

const MAX_ENTRIES = 20
const MAX_STRING = 500
const MAX_BODY = 300
const SNAPSHOT_MAX_CHARS = 20000
const SNAPSHOT_MAX_LINKS = 200

const cut = (str: string, max = MAX_STRING) => str.length > max ? str.slice(0, max - 1) + '…' : str

const withoutQuery = (url: string) => {
  const parsed = new URL(url)
  parsed.search = ''
  parsed.hash = ''
  return parsed
}

// browsers ask for it on their own, a missing one is noise for the agent
const isFavicon = (url: string) => new URL(url).pathname === '/favicon.ico'

const parseOrigin = (url: string) => {
  try {
    return new URL(url).origin
  } catch (err) {
    return undefined
  }
}

export const createReportCollector = (page: Page, target: string) => {
  const started = Date.now()
  const targetOrigin = parseOrigin(target)
  const consoleErrors: ConsoleEntry[] = []
  let consoleWarnings = 0
  const pageErrors: string[] = []
  const failedRequests: FailedRequest[] = []
  const pending: Promise<void>[] = []
  let status: number | undefined
  let statusText: string | undefined

  const sameOrigin = (url: string) => parseOrigin(url) === targetOrigin

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const { url, lineNumber } = msg.location()
      consoleErrors.push({ text: msg.text(), ...(url ? { url } : {}), ...(url && lineNumber !== undefined ? { line: lineNumber } : {}) })
    } else if (msg.type() === 'warn') {
      consoleWarnings++
    }
  })
  // cross-host frames are aborted by openInPage (reportFrames), only their origin is kept
  const blockedFrames: string[] = []
  page.on('request', request => {
    if (!config.onlySameHost || !request.isNavigationRequest() || request.frame() === page.mainFrame()) return
    if (!/^https?:/.test(request.url()) || isSameHost(request.url(), target)) return
    const origin = parseOrigin(request.url())
    if (origin && !blockedFrames.includes(origin)) blockedFrames.push(origin)
  })
  page.on('pageerror', err => {
    pageErrors.push(err instanceof Error ? (err.stack || err.message) : String(err))
  })
  page.on('requestfailed', request => {
    if (!sameOrigin(request.url()) || isFavicon(request.url())) return
    const url = withoutQuery(request.url())
    failedRequests.push({ method: request.method(), url: url.href, path: url.pathname, errorText: request.failure()?.errorText })
  })
  page.on('response', response => {
    const request = response.request()
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      status = response.status()
      statusText = response.statusText()
    }
    if (response.status() < 400 || !sameOrigin(response.url()) || isFavicon(response.url())) return
    const url = withoutQuery(response.url())
    const entry: FailedRequest = {
      method: request.method(),
      url: url.href,
      path: url.pathname,
      status: response.status(),
      statusText: response.statusText()
    }
    failedRequests.push(entry)
    pending.push((async () => {
      const contentType = response.headers()['content-type'] ?? ''
      if (/^text\/|json|html/i.test(contentType)) {
        try {
          const body = (await response.text()).trim()
          if (body) entry.body = cut(body, MAX_BODY)
        } catch (err) {
          // the body is not always available (redirects, aborted requests)
        }
      } else if (contentType) {
        entry.body = `[${contentType}]`
      }
    })())
  })

  const finish = async (ready: Ready): Promise<RenderReport> => {
    // events of the last requests can reach us a few ms after the page signaled it is ready
    await new Promise(resolve => setTimeout(resolve, 100))
    await Promise.all(pending)
    const finalUrl = page.url()
    const [title, snapshot] = await Promise.all([
      page.title().catch(() => ''),
      ariaSnapshot(page, { maxChars: SNAPSHOT_MAX_CHARS, maxLinks: SNAPSHOT_MAX_LINKS })
    ])
    let verdict: Verdict
    if (new URL(finalUrl, target).pathname.startsWith('/simple-directory/login')) verdict = 'unauthenticated'
    else if (ready === 'timeout') verdict = 'timeout'
    else if (consoleErrors.length || pageErrors.length || failedRequests.length || blockedFrames.length || (status !== undefined && status >= 400)) verdict = 'errors'
    else verdict = 'ok'

    return {
      url: target,
      finalUrl,
      status,
      statusText,
      ready,
      durationMs: Date.now() - started,
      title: cut(title),
      consoleErrors: consoleErrors.slice(0, MAX_ENTRIES).map(e => ({ ...e, text: cut(e.text), ...(e.url ? { url: cut(e.url) } : {}) })),
      consoleWarnings,
      pageErrors: pageErrors.slice(0, MAX_ENTRIES).map(e => cut(e)),
      failedRequests: failedRequests.slice(0, MAX_ENTRIES).map(f => ({ ...f, url: cut(f.url), path: cut(f.path), ...(f.errorText ? { errorText: cut(f.errorText) } : {}) })),
      blockedFrames: blockedFrames.slice(0, MAX_ENTRIES),
      snapshot,
      verdict
    }
  }

  return { finish }
}
