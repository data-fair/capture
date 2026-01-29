module.exports = {
  port: 'PORT',
  privateDirectoryUrl: 'PRIVATE_DIRECTORY_URL',
  onlySameHost: 'ONLY_SAME_HOST',
  useHostHeader: 'USE_HOST_HEADER',
  helmet: {
    active: 'HELMET_ACTIVE'
  },
  screenshotTimeout: 'SCREENSHOT_TIMEOUT',
  concurrency: 'CONCURRENCY',
  defaultLang: 'DEFAULT_LANG',
  defaultTimezone: 'DEFAULT_TIMEZONE',
  secretKeys: {
    capture: 'SECRET_CAPTURE'
  },
  puppeteerLaunchOptions: {
    args: {
      __name: 'PUPPETEER_ARGS',
      __format: 'json'
    }
  }
}
