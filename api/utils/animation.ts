import { file } from 'tmp-promise'
import config from '#config'
import fs from 'node:fs'
import { promisify } from 'node:util'
import { pipeline } from 'node:stream/promises'
import GifEncoder from 'gif-encoder'
import getPixelsCb from 'get-pixels'
import { optimizeGif } from './gifsicle.ts'
import debug from 'debug'
import { type Page } from 'puppeteer'

const getPixels = promisify(getPixelsCb)

export const capture = async (target: string, page: Page, width: number, height: number) => {
  let stopped = false
  const gif = new GifEncoder(width, height)
  gif.setFrameRate(15) // 15fps seams like a good compromise for a gif
  gif.writeHeader()
  const { path, cleanup } = await file({ postfix: '.gif' })
  const pipelinePromise = pipeline(gif, fs.createWriteStream(path))
  let i = 0
  while (!stopped && i < config.maxAnimationFrames) {
    i++
    if (i % 15 === 0) debug(`[${target}] ${i} frames taken`)
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
    // puppeteer returns a plain Uint8Array, but get-pixels switches on Buffer.isBuffer to tell
    // raw image data from a file path, and would treat the frame as a filename otherwise
    const frame = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    const pixels = await getPixels(frame, 'image/png')
    gif.addFrame(pixels.data)
  }
  gif.finish()
  await pipelinePromise
  debug(`[${target}] gif screenshot is taken`)
  const rawBuffer = await fs.promises.readFile(path)
  cleanup()
  return await optimizeGif(rawBuffer, 2)
}
