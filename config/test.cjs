module.exports = {
  // a port drawn per checkout in .env (dev/dev.json, loaded by the test script) so worktrees run
  // their tests at the same time; 5607 without .env (CI)
  port: Number(process.env.TEST_API_PORT || 5607),
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
