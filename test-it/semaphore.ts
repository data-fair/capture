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

  it('rejects beyond maxWaiting, without disturbing the queue', async () => {
    const sem = createSemaphore(1, { maxWaiting: 1 })
    const first = deferred<string>()
    const p1 = sem.run(() => first.promise)
    const p2 = sem.run(async () => 'second')
    await assert.rejects(sem.run(async () => 'third'), (err: any) => err.code === 'queue-full')
    assert.equal(sem.pending(), 1)
    first.resolve('first')
    assert.equal(await p1, 'first')
    assert.equal(await p2, 'second')
  })

  it('rejects a call that waited longer than maxWaitTime, and takes it out of the queue', async () => {
    const sem = createSemaphore(1, { maxWaitTime: 50 })
    const first = deferred<string>()
    const p1 = sem.run(() => first.promise)
    let lateStarted = false
    await assert.rejects(sem.run(async () => { lateStarted = true }), (err: any) => err.code === 'queue-timeout')
    assert.equal(sem.pending(), 0)
    first.resolve('first')
    await p1
    await tick()
    assert.equal(lateStarted, false)
    assert.equal(sem.active(), 0)
  })

  it('rejects an aborted call, before or while it waits', async () => {
    const sem = createSemaphore(1)
    const first = deferred<string>()
    const p1 = sem.run(() => first.promise)
    const controller = new AbortController()
    let abortedStarted = false
    const p2 = sem.run(async () => { abortedStarted = true }, controller.signal)
    await tick()
    controller.abort()
    await assert.rejects(p2, (err: any) => err.code === 'aborted')
    assert.equal(sem.pending(), 0)
    await assert.rejects(sem.run(async () => {}, controller.signal), (err: any) => err.code === 'aborted')
    first.resolve('first')
    await p1
    await tick()
    assert.equal(abortedStarted, false)
    assert.equal(sem.active(), 0)
  })
})
