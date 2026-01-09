import { file } from 'tmp-promise'
import config from '#config'
import fs from 'fs'
import { promisify } from 'util'
import stream from 'stream'
import GifEncoder from 'gif-encoder'
import getPixelsCb from 'get-pixels'
import imageminGifsicle from 'imagemin-gifsicle'
import debug from 'debug'
import { type Page } from 'puppeteer'

const pipeline = promisify(stream.pipeline)
const getPixels = promisify(getPixelsCb)

export const capture = async (target: string, page: Page, width: number, height: number, res) => {
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
    let buffer
    await Promise.race([
      page.screenshot().then(b => { buffer = b }),
      new Promise(resolve => setTimeout(resolve, config.screenshotTimeout))
    ])
    if (!buffer) throw new Error(`Failed to capture animation frame of page "${target}" before timeout`)
    const pixels = await getPixels(buffer, 'image/png')
    gif.addFrame(pixels.data)
  }
  gif.finish()
  await pipelinePromise
  debug(`[${target}] gif screenshot is taken`)
  const rawBuffer = await fs.promises.readFile(path)
  cleanup()
  const compressedBuffer = await imageminGifsicle({ optimizationLevel: 2 })(rawBuffer)
  return compressedBuffer
}
