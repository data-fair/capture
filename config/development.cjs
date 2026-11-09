module.exports = {
  // the zellij api pane sets PORT from the port drawn in .env (dev/dev.json)
  port: 5607,
  // directoryUrl: 'http://localhost:5990/simple-directory',
  onlySameHost: false,
  concurrency: 2,
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
  },
}
