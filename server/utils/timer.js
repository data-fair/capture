const debug = require('debug')('timer')
const prometheus = require('./prometheus')

exports.createTimer = (name, type) => {
  let currentTime = new Date().getTime()
  return {
    type,
    times: { total: 0 },
    step (step) {
      const newTime = new Date().getTime()
      this.times[step] = newTime - currentTime
      this.times.total += this.times[step]
      currentTime = newTime
    },
    finish () {
      debug(`${name}, type=${this.type}, ${Object.keys(this.times).map(step => (step + '=' + (Math.round(this.times[step] / 10) / 1000))).join(', ')}`)
      for (const step in this.times) {
        prometheus.tasks(this.type).labels({ step }).observe(this.times[step] / 1000)
      }
    }
  }
}
