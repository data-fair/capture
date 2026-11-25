const { existsSync, readFileSync } = require('node:fs')
const { parseEnv } = require('node:util')

// only TEST_API_PORT is read from .env (dev/default.env): the other values a .env may hold are
// those of the dev API (PORT, secrets...), not of the tests
const dotenv = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {}

module.exports = {
  port: Number(process.env.TEST_API_PORT || dotenv.TEST_API_PORT || 6101),
  screenshotTimeout: 2000,
  onlySameHost: true,
  useHostHeader: true,
  secretKeys: {
    capture: 'capture',
    inspect: 'inspect'
  },
  // the chrome-headless-shell downloaded by puppeteer (npx puppeteer browsers install
  // chrome-headless-shell). Outside of a container, AppArmor (Ubuntu >= 23.10) forbids its sandbox
  puppeteerLaunchOptions: {
    executablePath: null,
    args: ['--no-sandbox']
  },
  observer: {
    active: false
  },
  helmet: {
    active: false
  }
}
