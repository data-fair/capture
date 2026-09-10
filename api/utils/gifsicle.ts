import { spawn } from 'node:child_process'

/**
 * Optimize a GIF buffer using the gifsicle binary provided by the system.
 *
 * This replaces the imagemin-gifsicle package, whose only role was to spawn the
 * same binary: it pulled in the abandoned bin-wrapper/download/decompress chain
 * (used solely to fetch the binary at install time) and with it the bulk of this
 * project's dependency vulnerabilities. The binary now comes from the distro.
 */
/**
 * Fail at startup rather than on the first animated capture: gifsicle used to be
 * bundled by imagemin-gifsicle in any install, and is now expected from the system.
 */
export const start = () => new Promise<void>((resolve, reject) => {
  const child = spawn('gifsicle', ['--version'], { stdio: 'ignore' })
  child.on('error', () => reject(new Error('the gifsicle binary is required for animated captures but was not found in PATH')))
  child.on('close', code => {
    if (code === 0) resolve()
    else reject(new Error(`the gifsicle binary is not usable, "gifsicle --version" exited with code ${code}`))
  })
})

export const optimizeGif = (input: Buffer, optimizationLevel: number) => {
  // non-GIF input is returned untouched, as imagemin-gifsicle did
  if (input.subarray(0, 3).toString('latin1') !== 'GIF') return Promise.resolve(input)

  const args = ['--no-warnings', '--no-app-extensions', `--optimize=${optimizationLevel}`]
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn('gifsicle', args)
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    child.stdout.on('data', chunk => stdout.push(chunk))
    child.stderr.on('data', chunk => stderr.push(chunk))
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) resolve(Buffer.concat(stdout))
      else reject(new Error(`gifsicle exited with code ${code}: ${Buffer.concat(stderr).toString()}`))
    })
    // gifsicle may exit before consuming all of stdin, do not crash on EPIPE
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}
