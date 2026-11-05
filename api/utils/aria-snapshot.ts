import type { Page, SerializedAXNode } from 'puppeteer'

/* eslint-disable no-control-regex */
// yamlEscapeKeyIfNeeded and yamlEscapeValueIfNeeded are copied from Playwright
// https://github.com/microsoft/playwright/blob/main/packages/isomorphic/yaml.ts
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export function yamlEscapeKeyIfNeeded (str: string): string {
  if (!yamlStringNeedsQuotes(str)) { return str }
  return '\'' + str.replace(/'/g, '\'\'') + '\''
}

export function yamlEscapeValueIfNeeded (str: string): string {
  if (!yamlStringNeedsQuotes(str)) { return str }
  return '"' + str.replace(/[\\"\x00-\x1f\x7f-\x9f]/g, c => {
    switch (c) {
      case '\\':
        return '\\\\'
      case '"':
        return '\\"'
      case '\b':
        return '\\b'
      case '\f':
        return '\\f'
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\t':
        return '\\t'
      default: {
        const code = c.charCodeAt(0)
        return '\\x' + code.toString(16).padStart(2, '0')
      }
    }
  }) + '"'
}

function yamlStringNeedsQuotes (str: string): boolean {
  if (str.length === 0) { return true }

  // Strings with leading or trailing whitespace need quotes
  if (/^\s|\s$/.test(str)) { return true }

  // Strings containing control characters need quotes
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/.test(str)) { return true }

  // Strings starting with '-' need quotes
  if (/^-/.test(str)) { return true }

  // Strings containing ':' or '\n' followed by a space or at the end need quotes
  if (/[\n:](\s|$)/.test(str)) { return true }

  // Strings containing '#' preceded by a space need quotes (comment indicator)
  if (/\s#/.test(str)) { return true }

  // Strings that contain line breaks need quotes
  if (/[\n\r]/.test(str)) { return true }

  // Strings starting with indicator characters or quotes need quotes
  if (/^[&*\],?!>|@"'#%]/.test(str)) { return true }

  // Strings containing special characters that could cause ambiguity
  if (/[{}`]/.test(str)) { return true }

  // YAML array starts with [
  if (/^\[/.test(str)) { return true }

  // Non-string types recognized by YAML
  if (!isNaN(Number(str)) || ['y', 'n', 'yes', 'no', 'true', 'false', 'on', 'off', 'null', '~'].includes(str.toLowerCase())) { return true }

  // YAML special float values: .inf, -.inf, .nan and their case variants
  if (/^[-+]?\.(inf|nan)$/i.test(str)) { return true }

  return false
}

/* eslint-enable no-control-regex */

const indent = (depth: number) => '  '.repeat(depth)

const createKey = (node: SerializedAXNode) => {
  let key = node.role === 'Iframe' ? 'iframe' : node.role
  // YAML has a limit of 1024 characters per key, leave room for the role and attributes
  const name = text(node)
  if (name && name.length <= 900) key += ' ' + JSON.stringify(name)
  if (node.checked === 'mixed') key += ' [checked=mixed]'
  if (node.checked === true) key += ' [checked]'
  if (node.disabled) key += ' [disabled]'
  if (node.expanded) key += ' [expanded]'
  if (node.role === 'heading' && node.level) key += ` [level=${node.level}]`
  if (node.pressed === 'mixed') key += ' [pressed=mixed]'
  if (node.pressed === true) key += ' [pressed]'
  if (node.selected) key += ' [selected]'
  if (node.invalid && node.invalid !== 'false') key += ' [invalid]'
  return key
}

const isText = (node: SerializedAXNode) => node.role === 'StaticText'
const text = (node: SerializedAXNode) => (node.name ?? '').replace(/\s+/g, ' ').trim()

// interestingOnly would drop useful containers (paragraph, list, listitem), so the whole tree is
// requested and its structural noise is flattened here: children of unnamed none/generic nodes and
// of nested documents (iframes) are hoisted, text boxes and list markers are dropped
const flatten = (nodes: SerializedAXNode[] | undefined): SerializedAXNode[] => {
  const result: SerializedAXNode[] = []
  for (const node of nodes ?? []) {
    if (node.role === 'InlineTextBox' || node.role === 'ListMarker') continue
    if (node.role === 'RootWebArea' || ((node.role === 'none' || node.role === 'generic') && !node.name)) result.push(...flatten(node.children))
    else result.push({ ...node, children: flatten(node.children) })
  }
  return result
}

export const ariaSnapshot = async (page: Page, opts: { maxChars: number, maxLinks: number }): Promise<string> => {
  const root = await page.accessibility.snapshot({ interestingOnly: false, includeIframes: true })
  if (!root) return ''
  const lines: string[] = []
  let links = 0

  const visitText = (text: string, depth: number) => {
    const escaped = yamlEscapeValueIfNeeded(text)
    if (escaped) lines.push(indent(depth) + '- text: ' + escaped)
  }

  const visit = async (node: SerializedAXNode, depth: number) => {
    if (isText(node)) return visitText(text(node), depth)
    const key = indent(depth) + '- ' + yamlEscapeKeyIfNeeded(createKey(node))

    let children = node.children ?? []
    // children texts that only repeat the name are redundant
    if (text(node) && children.length && children.every(isText) && text({ name: children.map(c => c.name ?? '').join('') } as SerializedAXNode) === text(node)) children = []

    let href: string | undefined
    if (node.role === 'link' && links < opts.maxLinks) {
      links++
      try {
        const handle = await node.elementHandle()
        href = (await handle?.evaluate(el => el.getAttribute('href'))) ?? node.url
        await handle?.dispose()
      } catch (err) {
        href = node.url
      }
    }

    let inlineText: string | undefined
    if ((node.role === 'textbox' || node.role === 'combobox') && node.value !== undefined && node.value !== '') inlineText = String(node.value)
    else if (!text(node) && children.length === 1 && isText(children[0]) && !href) {
      inlineText = text(children[0])
      children = []
    }

    if (inlineText !== undefined && !href && !children.length) {
      lines.push(key + ': ' + yamlEscapeValueIfNeeded(inlineText))
    } else if (!href && !children.length && inlineText === undefined) {
      lines.push(key)
    } else {
      lines.push(key + ':')
      if (href) lines.push(indent(depth + 1) + '- /url: ' + yamlEscapeValueIfNeeded(href))
      if (inlineText !== undefined) visitText(inlineText, depth + 1)
      for (const child of children) await visit(child, depth + 1)
    }
  }

  for (const child of flatten(root.children)) await visit(child, 0)

  // truncate at a line boundary, keeping room for the last line
  const reserve = 50
  let size = 0
  let kept = 0
  for (const line of lines) {
    if (size + line.length + 1 > opts.maxChars - reserve) break
    size += line.length + 1
    kept++
  }
  if (kept < lines.length) {
    return lines.slice(0, kept).concat(`# snapshot truncated: ${lines.length - kept} more lines`).join('\n')
  }
  return lines.join('\n')
}
