// Limits how many async functions run at the same time, the others wait in FIFO order.
export const createSemaphore = (max: number) => {
  let active = 0
  const queue: Array<() => void> = []

  const acquire = () => new Promise<void>(resolve => {
    if (active < max) {
      active++
      resolve()
    } else {
      queue.push(() => {
        active++
        resolve()
      })
    }
  })

  const release = () => {
    active--
    queue.shift()?.()
  }

  return {
    async run<T> (fn: () => Promise<T>): Promise<T> {
      await acquire()
      try {
        return await fn()
      } finally {
        release()
      }
    },
    // number of calls waiting for a free slot
    pending: () => queue.length
  }
}
