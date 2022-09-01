module.exports = {
  screenshotTimeout: 2000,
  puppeteerLaunchOptions: {
    executablePath: 'google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  prometheus: {
    active: false
  }
}
