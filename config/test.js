module.exports = {
  screenshotTimeout: 2000,
  puppeteerLaunchOptions: {
    executablePath: 'google-chrome',
    args: ['--no-sandbox']
  },
  prometheus: {
    active: false
  }
}
