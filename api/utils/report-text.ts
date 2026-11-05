import type { RenderReport } from './report.ts'

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
  lines.push(`- Verdict: ${report.verdict}`)

  if (report.consoleErrors.length || report.pageErrors.length) {
    lines.push('### Console')
    for (const entry of report.consoleErrors) {
      lines.push(`[ERROR] ${entry.text}` + (entry.url ? ` @ ${entry.url}${entry.line !== undefined ? ':' + entry.line : ''}` : ''))
    }
    for (const error of report.pageErrors) lines.push(error)
  }

  if (report.failedRequests.length || report.blockedFrames.length) {
    lines.push('### Network')
    let i = 0
    for (const request of report.failedRequests) {
      i++
      if (request.status !== undefined) {
        lines.push(`${i}. [${request.method}] ${request.url} => [${request.status}] ${request.statusText ?? ''}`.trimEnd())
        if (request.body) lines.push(`   ${request.body}`)
      } else {
        lines.push(`${i}. [${request.method}] ${request.url} => [FAILED] ${request.errorText ?? ''}`.trimEnd())
      }
    }
    for (const origin of report.blockedFrames) {
      i++
      lines.push(`${i}. [GET] ${origin} => [BLOCKED] cross-host frame not rendered`)
    }
  }

  lines.push('### Snapshot', '```yaml', report.snapshot, '```')
  return lines.join('\n')
}
