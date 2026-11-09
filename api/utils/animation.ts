import path from 'node:path'
import { Piscina } from 'piscina'
import config from '#config'
import { optimizeGif } from './gifsicle.ts'
import debugModule from 'debug'
import log from '@data-fair/lib-node/log.js'
import { type Page } from 'puppeteer'
import type { GifEncodeTask } from '../threads/gif-encode.ts'

const debug = debugModule('capture')

// the gif encoding is CPU heavy pure JS, it runs in worker threads so that it does not block the
// service. maxThreads also bounds the number of gifs encoded at the same time
export const gifEncodePiscina = new Piscina<GifEncodeTask, Uint8Array>({
  filename: path.resolve(import.meta.dirname, '../threads/gif-encode.ts'),
  minThreads: 0,
  idleTimeout: 10 * 60 * 1000,
  maxThreads: config.gifThreads
})
// a pool emits 'error' when a thread dies with no task in flight; without a listener it crashes the process
gifEncodePiscina.on('error', (err) => log.error('gif encoding worker error', { code: 'piscina-gif-encode', err }))

// a typed array alone in its ArrayBuffer, so that the ArrayBuffer can be transferred to a worker.
// puppeteer returns Buffers decoded from base64, the small ones are slices of the shared Buffer
// pool (not transferable, and other buffers live in it): those are copied, the others kept
const ownBuffer = (frame: Uint8Array) => {
  if (frame.byteOffset === 0 && frame.byteLength === frame.buffer.byteLength && !(frame.buffer instanceof SharedArrayBuffer)) return frame
  return new Uint8Array(frame)
}

export const capture = async (target: string, page: Page, width: number, height: number) => {
  let stopped = false
  const frames: Uint8Array[] = []
  while (!stopped && frames.length < config.maxAnimationFrames) {
    if (frames.length % 15 === 0) debug(`[${target}] ${frames.length} frames taken`)
    stopped = await page.evaluate(() => {
      // @ts-ignore
      return window.animateCaptureFrame()
    })
    let buffer: Uint8Array | undefined
    await Promise.race([
      // frames are decoded to raw pixels right away, so spending time on png compression is wasted
      page.screenshot({ optimizeForSpeed: true }).then(b => { buffer = b }),
      new Promise(resolve => setTimeout(resolve, config.screenshotTimeout))
    ])
    if (!buffer) throw new Error(`Failed to capture animation frame of page "${target}" before timeout`)
    frames.push(ownBuffer(buffer))
  }
  debug(`[${target}] ${frames.length} frames taken, encode the gif`)
  // 15fps seams like a good compromise for a gif
  // the frames are transferred to the worker, not copied: they are not usable here afterwards
  const raw = await gifEncodePiscina.run({ width, height, frameRate: 15, frames }, { transferList: frames.map(f => f.buffer as ArrayBuffer) })
  debug(`[${target}] gif screenshot is taken`)
  return await optimizeGif(Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength), 2)
}

export const stop = () => gifEncodePiscina.destroy()
