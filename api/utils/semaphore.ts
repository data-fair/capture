// Limits how many async functions run at the same time, the others wait in FIFO order.
// The queue can be bounded (maxWaiting), the wait limited (maxWaitTime), and a waiting call is
// dropped when its signal aborts. Rejections carry a code: queue-full, queue-timeout, aborted.

export type SemaphoreOptions = { maxWaiting?: number, maxWaitTime?: number }

export class SemaphoreError extends Error {
  code: 'queue-full' | 'queue-timeout' | 'aborted'
  constructor (code: SemaphoreError['code'], message: string) {
    super(message)
    this.code = code
  }
}

export const createSemaphore = (max: number, options: SemaphoreOptions = {}) => {
  let active = 0
  const queue: Array<() => void> = []

  const acquire = (signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new SemaphoreError('aborted', 'aborted before acquiring a slot'))
    if (active < max) {
      active++
      return resolve()
    }
    if (options.maxWaiting !== undefined && queue.length >= options.maxWaiting) {
      return reject(new SemaphoreError('queue-full', `more than ${options.maxWaiting} calls are already waiting`))
    }
    let timer: NodeJS.Timeout | undefined
    const leave = (err: SemaphoreError) => {
      const i = queue.indexOf(grant)
      if (i !== -1) queue.splice(i, 1)
      cleanup()
      reject(err)
    }
    const onAbort = () => leave(new SemaphoreError('aborted', 'aborted while waiting for a slot'))
    const cleanup = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
    const grant = () => {
      cleanup()
      active++
      resolve()
    }
    queue.push(grant)
    signal?.addEventListener('abort', onAbort, { once: true })
    if (options.maxWaitTime !== undefined) {
      timer = setTimeout(() => leave(new SemaphoreError('queue-timeout', `waited more than ${options.maxWaitTime}ms for a slot`)), options.maxWaitTime)
    }
  })

  const release = () => {
    active--
    queue.shift()?.()
  }

  return {
    max,
    async run<T> (fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
      await acquire(signal)
      try {
        return await fn()
      } finally {
        release()
      }
    },
    // number of calls waiting for a free slot
    pending: () => queue.length,
    // number of calls running
    active: () => active
  }
}
