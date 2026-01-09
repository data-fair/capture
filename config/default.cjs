module.exports = {
  port: 8080,
  publicUrl: 'http://localhost:5607',
  privateDirectoryUrl: 'http://simple-directory:8080',
  onlySameHost: true, // better as we use chrome without sandboxing
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
  observer: {
    active: true,
    port: 9090
  }
}
