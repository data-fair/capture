import type { RenderReport } from './report.ts'
import { isSameHost } from './page.ts'

const DETAILS_MAX_CHARS = 8000

// layout of Playwright MCP responses (### Page, ### Console, ### Network, ### Snapshot),
// plus the Ready, Verdict, [BLOCKED] and body lines that are specific to this tool
export const reportText = (report: RenderReport): string => {
  const lines: string[] = ['### Page']
  lines.push(`- Page URL: ${report.finalUrl}`)
  lines.push(`- Page Title: ${report.title}`)
  if (report.status !== undefined && (report.status < 200 || report.status >= 300)) {
    lines.push(`- HTTP status: ${report.status} ${report.statusText ?? ''}`.trimEnd())
  }
  const errors = report.consoleErrors.length + report.pageErrors.length
  if (errors > 0 || report.consoleWarnings > 0) {
    lines.push(`- Console: ${errors} errors, ${report.consoleWarnings} warnings`)
  }
  lines.push(`- Ready: ${report.ready === 'timeout' ? `timeout after ${report.durationMs} ms` : report.ready}`)
  if (!isSameHost(report.finalUrl, report.url)) {
    lines.push(`- Note: navigated away from ${new URL(report.url).host} to ${new URL(report.finalUrl).host}`)
  }
  lines.push(`- Verdict: ${report.verdict}`)

  // Console and Network together are bounded, the snapshot has its own budget
  const details: string[] = []
  // first, the page's own diagnosis is the most useful line
  if (report.declaredErrors.length) {
    details.push('### Declared errors')
    for (const message of report.declaredErrors) details.push(`- ${message}`)
  }
  if (report.consoleErrors.length || report.pageErrors.length) {
    details.push('### Console')
    for (const entry of report.consoleErrors) {
      details.push(`[ERROR] ${entry.text}` + (entry.url ? ` @ ${entry.url}${entry.line !== undefined ? ':' + entry.line : ''}` : ''))
    }
    for (const error of report.pageErrors) details.push(error)
  }

  if (report.failedRequests.length || report.blockedFrames.length) {
    details.push('### Network')
    let i = 0
    for (const request of report.failedRequests) {
      i++
      if (request.status !== undefined) {
        details.push(`${i}. [${request.method}] ${request.url} => [${request.status}] ${request.statusText ?? ''}`.trimEnd())
        if (request.body) details.push(`   ${request.body}`)
      } else {
        details.push(`${i}. [${request.method}] ${request.url} => [FAILED] ${request.errorText ?? ''}`.trimEnd())
      }
    }
    for (const origin of report.blockedFrames) {
      i++
      details.push(`${i}. [GET] ${origin} => [BLOCKED] cross-host frame not rendered`)
    }
  }

  // truncate at a line boundary, keeping room for the last line
  let size = 0
  let kept = 0
  for (const line of details) {
    if (size + line.length + 1 > DETAILS_MAX_CHARS - 50) break
    size += line.length + 1
    kept++
  }
  lines.push(...details.slice(0, kept))
  if (kept < details.length) lines.push(`# console and network truncated: ${details.length - kept} more lines`)

  lines.push('### Snapshot', '```yaml', report.snapshot, '```')
  return lines.join('\n')
}
