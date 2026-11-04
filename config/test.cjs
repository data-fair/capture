module.exports = {
  // a port drawn per checkout in .env (dev/dev.json, loaded by the test script) so worktrees run
  // their tests at the same time; 5607 without .env (CI)
  port: Number(process.env.TEST_API_PORT || 5607),
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
