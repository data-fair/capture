module.exports = {
  port: 5607,
  screenshotTimeout: 2000,
  onlySameHost: true,
  useHostHeader: true,
  secretKeys: {
    capture: 'capture'
  },
  observer: {
    active: false
  },
  helmet: {
    active: false
  }
}
