module.exports = {
  screenshotTimeout: 2000,
  puppeteerLaunchOptions: {
    executablePath: 'chromium',
    args: ['--no-sandbox']
  },
  observer: {
    active: false
  }
}
