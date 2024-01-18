module.exports = {
  port: 5607,
  publicUrl: 'http://localhost:5607',
  directoryUrl: null,
  sessionDomain: null,
  onlySameHost: false,
  trustHeaderHost: false, // when applying onlySameHost policy we will trust req.headers.host instead of relying on config.publicUrl
  screenshotTimeout: 20000,
  concurrency: 5,
  concurrencyPublic: null,
  defaultLang: 'fr-FR',
  defaultTimezone: 'Europe/Paris',
  secretKeys: {
    capture: null
  },
  maxAnimationFrames: 1800, // 2 minutes at 15fps
  puppeteerLaunchOptions: {
    executablePath: 'google-chrome-stable',
    // args: ['--use-gl=egl', '--use-angle=swiftshader', '--in-process-gpu'],
    args: [],
    headless: 'new'
  },
  prometheus: {
    active: true,
    port: 9090
  }
}
