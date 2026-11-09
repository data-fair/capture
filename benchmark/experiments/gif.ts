import { promisify } from 'node:util'
import { monitorEventLoopDelay } from 'node:perf_hooks'
import GifEncoder from 'gif-encoder'
import getPixelsCb from 'get-pixels'
import { optimizeGif } from '../../api/utils/gifsicle.ts'
import { withEnv, type Experiment } from './common.ts'
import { setupPage, gotoAndWait, cleanPage } from '../lib/capture.ts'
import { selfCpuMs, treeCpuMs } from '../lib/proc.ts'
import { runInterleaved, report, save } from '../lib/runner.ts'

// H: an animated capture is dominated by node-side work, not by the browser: each frame is a PNG
// that is decoded in pure JS (get-pixels/pngjs) then color-quantized in pure JS (gif-encoder,
// NeuQuant), all on the main thread, which blocks the event loop of the whole service (other
// requests, metrics, health checks) for the duration. The stages are timed separately, with the
// event loop delay measured meanwhile. Variant: jpeg frames instead of png.

const getPixels = promisify(getPixelsCb)

// sharp (libvips + cgif + libimagequant, native, off the main thread) is not a dependency of the
// service: point BENCH_SHARP to an install of it to add the variant (npm i sharp in a scratch dir)
const loadSharp = async () => {
  if (!process.env.BENCH_SHARP) return undefined
  return (await import(process.env.BENCH_SHARP)).default
}

export const gif: Experiment = {
  description: 'animated GIF pipeline: per-stage cost and event loop blocking',
  async run (opts) {
    await withEnv(opts, async ({ url, l }) => {
      const context = await l.browser.createBrowserContext()
      const width = 800
      const height = 450
      const frames = 30
      const sharp = await loadSharp()
      const variants = ['png-fast', 'jpeg-90']
      if (sharp) variants.push('sharp')
      const results = await runInterleaved(variants, Math.max(2, Math.round(opts.runs / 2)), async (variant) => {
        const page = await context.newPage()
        await page.setViewport({ width, height })
        await setupPage(page)
        await gotoAndWait(page, url(`/fixtures/anim.html?frames=${frames}`), 'idle0')
        const h = monitorEventLoopDelay({ resolution: 5 })
        h.enable()
        const cpu0 = selfCpuMs()
        const bcpu0 = treeCpuMs(l.pid)
        const t = { evaluate: 0, screenshot: 0, decode: 0, encode: 0, gifsicle: 0 }
        const pngs: Buffer[] = []
        const gifEnc = new GifEncoder(width, height)
        gifEnc.setFrameRate(15)
        const chunks: Buffer[] = []
        gifEnc.on('data', (c: Buffer) => chunks.push(c))
        gifEnc.writeHeader()
        let stopped = false
        let n = 0
        const t0 = performance.now()
        while (!stopped) {
          n++
          let s = performance.now()
          // @ts-ignore
          stopped = await page.evaluate(() => window.animateCaptureFrame())
          t.evaluate += performance.now() - s
          s = performance.now()
          const buffer = await page.screenshot(variant === 'jpeg-90' ? { type: 'jpeg', quality: 90 } : { optimizeForSpeed: true })
          t.screenshot += performance.now() - s
          if (variant === 'sharp') {
            pngs.push(Buffer.from(buffer))
            continue
          }
          s = performance.now()
          const pixels = await getPixels(Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength), variant === 'jpeg-90' ? 'image/jpeg' : 'image/png')
          t.decode += performance.now() - s
          s = performance.now()
          gifEnc.addFrame(pixels.data)
          t.encode += performance.now() - s
        }
        gifEnc.finish()
        await new Promise(resolve => setImmediate(resolve))
        let raw = Buffer.concat(chunks)
        if (variant === 'sharp') {
          // decoding, quantization (libimagequant) and encoding (cgif) in libvips threads
          const s = performance.now()
          raw = await sharp(pngs, { join: { animated: true } }).gif({ delay: pngs.map(() => 67), loop: 0 }).toBuffer()
          t.encode = performance.now() - s
        }
        const s = performance.now()
        const optimized = await optimizeGif(raw, 2)
        t.gifsicle = performance.now() - s
        const totalMs = performance.now() - t0
        h.disable()
        await cleanPage(page)
        return {
          frames: n,
          totalMs,
          ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k + 'Ms', v])),
          nodeCpuMs: selfCpuMs() - cpu0,
          browserCpuMs: treeCpuMs(l.pid) - bcpu0,
          loopMaxMs: h.max / 1e6,
          loopP99Ms: h.percentile(99) / 1e6,
          rawKB: raw.length / 1024,
          KB: optimized.length / 1024
        }
      })
      report(`anim.html ${width}x${height}, 30 frames`, results, ['totalMs', 'evaluateMs', 'screenshotMs', 'decodeMs', 'encodeMs', 'gifsicleMs', 'nodeCpuMs', 'browserCpuMs', 'loopMaxMs', 'KB'])
      await context.close()
      save('gif', results)
    })
  }
}
