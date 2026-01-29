module.exports = {
  port: 5607,
  // directoryUrl: 'http://localhost:5990/simple-directory',
  onlySameHost: false,
  concurrency: 2,
  secretKeys: {
    capture: 'capture'
  },
  observer: {
    active: false
  },
  helmet: {
    active: false
  },
}
