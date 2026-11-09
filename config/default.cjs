module.exports = {
  port: 8080,
  // privateDirectoryUrl: 'http://simple-directory:8080',
  onlySameHost: true, // better as we use chrome without sandboxing
  useHostHeader: false, // defaults to using x-forwarded-host as other services of data-fair stack
  helmet: {
    active: true
  },
  screenshotTimeout: 20000,
  // for pages that do not call window.triggerCapture: network idle, then visual quiet, capped
  wait: {
    networkIdleTime: 500,
    quietTime: 200,
    maxSettleTime: 2000
  },
  // PNG encoding runs on the main thread of the browser, shared by all the captures: the large
  // ones are encoded fast (2-3x quicker, 1.1-1.5x bigger files)
  pngFastEncodingPixels: 1500000,
  concurrency: 5,
  // captures waiting for a browser context: beyond maxWaiting, or after maxWaitTime of waiting,
  // they are answered by a 503 (below the 60s timeout of the reverse proxy)
  queue: {
    maxWaiting: 100,
    maxWaitTime: 20000
  },
  inspectConcurrency: 1, // concurrent /inspect renders, each one holds a browser page
  defaultLang: 'fr-FR',
  defaultTimezone: 'Europe/Paris',
  secretKeys: {
    capture: null, // when set, required on /screenshot and /print from callers without a session
    inspect: null // required on /inspect, which is disabled without it
  },
  maxAnimationFrames: 1800, // 2 minutes at 15fps
  puppeteerLaunchOptions: {
    executablePath: '/usr/bin/google-chrome-stable',
    args: [],
    headless: true
  },
  observer: {
    active: true,
    port: 9090
  }
}
