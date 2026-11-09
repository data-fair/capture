// Runs in a piscina worker thread: decodes the png frames of an animated capture and encodes them
// as a gif. Both are pure JS and CPU heavy (NeuQuant quantization), on the main thread they
// blocked every other request of the service for seconds (cf benchmark/FINDINGS.md).
import { promisify } from 'node:util'
import GifEncoder from 'gif-encoder'
import getPixelsCb from 'get-pixels'
import { move } from 'piscina'

const getPixels = promisify(getPixelsCb)

export type GifEncodeTask = { width: number, height: number, frameRate: number, frames: Uint8Array[] }

export default async ({ width, height, frameRate, frames }: GifEncodeTask) => {
  const gif = new GifEncoder(width, height, { highWaterMark: 64 * 1024 * 1024 })
  const chunks: Buffer[] = []
  gif.on('data', (chunk: Buffer) => chunks.push(chunk))
  // finish() pushes the end of the stream, the last chunks are emitted asynchronously
  const ended = new Promise<void>(resolve => gif.once('end', () => resolve()))
  gif.setFrameRate(frameRate)
  gif.writeHeader()
  for (const frame of frames) {
    // get-pixels switches on Buffer.isBuffer to tell raw image data from a file path
    const pixels = await getPixels(Buffer.from(frame.buffer, frame.byteOffset, frame.byteLength), 'image/png')
    gif.addFrame(pixels.data)
  }
  gif.finish()
  await ended
  // the chunks are joined in an ArrayBuffer of our own, then transferred to the main thread, not
  // copied. Buffer.concat would not do: below half of Buffer.poolSize it returns a slice of the
  // shared Buffer pool, which cannot be transferred (DataCloneError)
  const result = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.byteLength, 0))
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return move(result)
}
