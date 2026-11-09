import { startFixturesServer } from '../lib/server.ts'
import { browserVariants, launch, type Launched } from '../lib/browsers.ts'
import type { LaunchOptions } from 'puppeteer'

export type Opts = { runs: number, browser: string }
export type Experiment = { description: string, run: (opts: Opts) => Promise<void> }

// a fixtures server and a browser for the duration of fn
export const withEnv = async <T>(opts: Opts, fn: (env: { url: (p: string) => string, l: Launched }) => Promise<T>, launchOptions: LaunchOptions = {}) => {
  const server = await startFixturesServer()
  const variant = browserVariants[opts.browser]
  if (!variant) throw new Error('unknown browser ' + opts.browser)
  const l = await launch(variant, launchOptions)
  console.log(`browser: ${variant.name} ${l.version}`)
  try {
    return await fn({ url: server.url, l })
  } finally {
    await l.browser.close()
    await server.close()
  }
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
