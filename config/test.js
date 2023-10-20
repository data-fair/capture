module.exports = {
  screenshotTimeout: 2000,
  puppeteerLaunchOptions: {
    executablePath: 'chromium',
    args: ['--no-sandbox']
  },
  prometheus: {
    active: false
  }
}
