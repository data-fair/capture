module.exports = {
  // DEV_API_PORT of .env (dev/default.env), exported by npm run dev; PORT overrides it
  port: Number(process.env.DEV_API_PORT || 6100),
  // directoryUrl: 'http://localhost:5990/simple-directory',
  onlySameHost: false,
  concurrency: 2,
  secretKeys: {
    // no key on /screenshot and /print, as in production without privateDirectoryUrl and
    // SECRET_CAPTURE: the callers of a dev environment (data-fair's thumbnails) send none
    capture: null,
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
