import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import puppeteer, { type Browser, type LaunchOptions } from 'puppeteer'
import { treePssMB, treeSize } from './proc.ts'

// Browser binaries compared. chrome-stable is what the Docker image installs (google-chrome-stable
// deb), the others are Chrome for Testing builds downloaded by @puppeteer/browsers
// (npx puppeteer browsers install chrome-headless-shell@<v>)
const cache = path.join(os.homedir(), '.cache', 'puppeteer')
const latest = (dir: string) => {
  if (!fs.existsSync(dir)) return undefined
  return fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop()
}
const cftVersion = latest(path.join(cache, 'chrome'))
const shellVersion = latest(path.join(cache, 'chrome-headless-shell'))

export type BrowserVariant = { name: string, launch: LaunchOptions }

// On Ubuntu >= 23.10 AppArmor forbids the unprivileged user namespaces of the sandbox to any
// binary without a profile: the google-chrome-stable deb installs one, the Chrome for Testing
// builds do not and only run with --no-sandbox. chrome-stable-nosandbox is the fair comparison.
export const browserVariants: Record<string, BrowserVariant> = {
  'chrome-stable': { name: 'chrome-stable', launch: { executablePath: '/usr/bin/google-chrome-stable', headless: true } },
  'chrome-stable-nosandbox': { name: 'chrome-stable-nosandbox', launch: { executablePath: '/usr/bin/google-chrome-stable', headless: true, args: ['--no-sandbox'] } },
  cft: { name: `cft-${cftVersion}`, launch: { executablePath: path.join(cache, 'chrome', cftVersion ?? '', 'chrome-linux64', 'chrome'), headless: true, args: ['--no-sandbox'] } },
  shell: { name: `shell-${shellVersion}`, launch: { executablePath: path.join(cache, 'chrome-headless-shell', shellVersion ?? '', 'chrome-headless-shell-linux64', 'chrome-headless-shell'), headless: 'shell', args: ['--no-sandbox'] } }
}

export type Launched = { browser: Browser, pid: number, launchMs: number, version: string }

export const launch = async (variant: BrowserVariant, extra: LaunchOptions = {}): Promise<Launched> => {
  const t0 = performance.now()
  const browser = await puppeteer.launch({
    ...variant.launch,
    ...extra,
    args: [...(variant.launch.args ?? []), ...(extra.args ?? [])]
  })
  const launchMs = performance.now() - t0
  const pid = browser.process()?.pid
  if (!pid) throw new Error('no browser pid')
  return { browser, pid, launchMs, version: await browser.version() }
}

export const browserFootprint = (l: Launched) => ({ pssMB: treePssMB(l.pid), processes: treeSize(l.pid) })
