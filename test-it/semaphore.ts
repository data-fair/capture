import assert from 'assert/strict'
import { describe, it } from 'node:test'
import { createSemaphore } from '../api/utils/semaphore.ts'

const deferred = <T = void>() => {
  let resolve!: (value: T) => void
  let reject!: (err: any) => void
  const promise = new Promise<T>((_resolve, _reject) => { resolve = _resolve; reject = _reject })
  return { promise, resolve, reject }
}

// let pending microtasks and already-queued continuations run
const tick = () => new Promise(resolve => setImmediate(resolve))

describe('semaphore', () => {
  it('does not start the second fn before the first settles when max is 1', async () => {
    const sem = createSemaphore(1)
    const first = deferred<string>()
    const second = deferred<string>()
    let secondStarted = false

    const p1 = sem.run(() => first.promise)
    const p2 = sem.run(async () => {
      secondStarted = true
      return second.promise
    })
    await tick()
    assert.equal(secondStarted, false)
    assert.equal(sem.pending(), 1)

    first.resolve('a')
    assert.equal(await p1, 'a')
    await tick()
    assert.equal(secondStarted, true)
    assert.equal(sem.pending(), 0)

    second.resolve('b')
    assert.equal(await p2, 'b')
  })

  it('releases the slot when the first fn rejects', async () => {
    const sem = createSemaphore(1)
    const failing = deferred<string>()
    const p1 = sem.run(() => failing.promise)
    const p2 = sem.run(async () => 'next')

    failing.reject(new Error('boom'))
    await assert.rejects(p1, /boom/)
    assert.equal(await p2, 'next')
    assert.equal(sem.pending(), 0)
  })
})
