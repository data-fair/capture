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
  help: 'Number of browser contexts closed after their capture (one fresh context per capture)'
})

export const acquireContextPending = new client.Gauge({
  name: 'df_capture_acquire_context_pending',
  help: 'Number of captures waiting for a slot',
  async collect () {
    this.set(pageUtils.captureSlots.pending())
  }
})
export const acquireContextMax = new client.Gauge({
  name: 'df_capture_acquire_context_max',
  help: 'Max number of captures running at the same time',
  async collect () {
    this.set(pageUtils.captureSlots.max)
  }
})
export const acquireContextBorrowed = new client.Gauge({
  name: 'df_capture_acquire_context_borrowed',
  help: 'Number of captures running',
  async collect () {
    this.set(pageUtils.captureSlots.active())
  }
})
