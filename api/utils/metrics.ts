// code instrumentation to expose metrics for prometheus
// follow this doc for naming conventions https://prometheus.io/docs/practices/naming/
// /metrics serves container/process/pod specific metrics while /global-metrics
// serves metrics for the whole data-fair installation no matter the scaling

import client from 'prom-client'
import * as pageUtils from './page.ts'

export const tasks = new client.Histogram({
  name: 'df_capture_tasks_seconds',
  help: 'Number and duration in seconds of capture tasks steps',
  buckets: [0.1, 0.3, 1, 3, 10],
  labelNames: ['step', 'type']
})
export const contextsCleanups = new client.Counter({
  name: 'df_capture_contexts_cleanups',
  help: 'Number of times a browser context was cleaned up for later reuse'
})

export const acquireContextPending = new client.Gauge({
  name: 'df_capture_acquire_context_pending',
  help: 'Number of tasks waiting to acquire a browser context',
  async collect () {
    this.set(pageUtils.contextPool && pageUtils.contextPool().pending)
  }
})
export const acquireContextMax = new client.Gauge({
  name: 'df_capture_acquire_context_max',
  help: 'Max number of browser contexts that can be borrowed by tasks',
  async collect () {
    this.set(pageUtils.contextPool && pageUtils.contextPool().max)
  }
})
export const acquireContextBorrowed = new client.Gauge({
  name: 'df_capture_acquire_context_borrowed',
  help: 'Number of browser contexts currently borrowed by a task',
  async collect () {
    this.set(pageUtils.contextPool && pageUtils.contextPool().borrowed)
  }
})
