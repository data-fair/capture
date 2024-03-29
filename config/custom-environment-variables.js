module.exports = {
  port: {
    __name: 'PORT',
    __format: 'json'
  },
  publicUrl: 'PUBLIC_URL',
  directoryUrl: 'DIRECTORY_URL',
  sessionDomain: 'SESSION_DOMAIN',
  onlySameHost: {
    __name: 'ONLY_SAME_HOST',
    __format: 'json'
  },
  trustHeaderHost: {
    __name: 'TRUST_HEADER_HOST',
    __format: 'json'
  },
  screenshotTimeout: {
    __name: 'SCREENSHOT_TIMEOUT',
    __format: 'json'
  },
  concurrency: {
    __name: 'CONCURRENCY',
    __format: 'json'
  },
  concurrencyPublic: {
    __name: 'CONCURRENCY_PUBLIC',
    __format: 'json'
  },
  defaultLang: 'DEFAULT_LANG',
  defaultTimezone: 'DEFAULT_TIMEZONE',
  secretKeys: {
    capture: 'SECRET_CAPTURE'
  },
  prometheus: {
    active: {
      __name: 'PROMETHEUS_ACTIVE',
      __format: 'json'
    },
    port: 'PROMETHEUS_PORT'
  },
  puppeteerLaunchOptions: {
    args: {
      __name: 'PUPPETEER_ARGS',
      __format: 'json'
    }
  }
}
