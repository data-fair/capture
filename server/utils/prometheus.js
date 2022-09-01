/* eslint-disable no-new */
// code instrumentation to expose metrics for prometheus
// follow this doc for naming conventions https://prometheus.io/docs/practices/naming/
// /metrics serves container/process/pod specific metrics while /global-metrics
// serves metrics for the whole data-fair installation no matter the scaling

const config = require('config')
const express = require('express')
const client = require('prom-client')
const eventToPromise = require('event-to-promise')
const asyncWrap = require('./async-wrap')
const pageUtils = require('./page')
const localRegister = new client.Registry()

// metrics server
const app = express()
const server = require('http').createServer(app)
app.get('/metrics', asyncWrap(async (req, res) => {
  res.set('Content-Type', localRegister.contentType)
  res.send(await localRegister.metrics())
}))

// local metrics incremented throughout the code
exports.internalError = new client.Counter({
  name: 'df_internal_error',
  help: 'Errors in some worker process, socket handler, etc.',
  labelNames: ['errorCode'],
  registers: [localRegister]
})
const tasksMetrics = {}
exports.tasks = (type) => {
  tasksMetrics[type] = tasksMetrics[type] || new client.Histogram({
    name: `df_capture_tasks_${type}_seconds`,
    help: `Number and duration in seconds of capture tasks ${type} steps`,
    buckets: [0.1, 0.3, 1, 3, 10],
    labelNames: ['step'],
    registers: [localRegister]
  })
  return tasksMetrics[type]
}
exports.acquireContextPending = new client.Gauge({
  name: 'df_capture_acquire_context_pending',
  help: 'Number of tasks waiting to acquire a browser context',
  registers: [localRegister],
  async collect () {
    this.set(pageUtils.contextPool && pageUtils.contextPool.pending)
  }
})
exports.acquireContextMax = new client.Gauge({
  name: 'df_capture_acquire_context_max',
  help: 'Max number of browser contexts that can be borrowed by tasks',
  registers: [localRegister],
  async collect () {
    this.set(pageUtils.contextPool && pageUtils.contextPool.max)
  }
})
exports.acquireContextBorrowed = new client.Gauge({
  name: 'df_capture_acquire_context_borrowed',
  help: 'Number of browser contexts currently borrowed by a task',
  registers: [localRegister],
  async collect () {
    this.set(pageUtils.contextPool && pageUtils.contextPool.borrowed)
  }
})

exports.start = async () => {
  server.listen(config.prometheus.port)
  await eventToPromise(server, 'listening')
  console.log('Prometheus metrics server listening on http://localhost:' + config.prometheus.port)
}

exports.stop = async () => {
  server.close()
  await eventToPromise(server, 'close')
}
