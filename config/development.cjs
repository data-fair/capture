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
  observer: {
    active: false
  },
  helmet: {
    active: false
  },
}
