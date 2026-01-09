import debugModule from 'debug'
import * as metrics from './metrics.ts'

const debug = debugModule('timer')

export class Timer {
  name: string
  type: string
  times: Record<string, number> = { total: 0 }
  currentTime = new Date().getTime()

  constructor (name: string, type: string) {
    this.name = name
    this.type = type
  }

  step (step: string) {
    const newTime = new Date().getTime()
    this.times[step] = newTime - this.currentTime
    this.times.total += this.times[step]
    this.currentTime = newTime
  }

  finish () {
    debug(`${name}, type=${this.type}, ${Object.keys(this.times).map(step => (step + '=' + (Math.round(this.times[step] / 10) / 1000))).join(', ')}`)
    for (const step in this.times) {
      metrics.tasks.labels({ step, type: this.type }).observe(this.times[step] / 1000)
    }
  }
}

export const createTimer = (name: string, type: string) => new Timer(name, type)
