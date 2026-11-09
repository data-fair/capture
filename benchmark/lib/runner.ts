import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { aggregate, compare } from './stats.ts'

export type Sample = Record<string, number | boolean | string | undefined>
export type Results = Record<string, Sample[]>

// Runs every variant `runs` times, interleaved (A B C, B C A, C A B...) so that a drift of the
// machine load hits all the variants alike. Warmup iterations are run and discarded.
// the current step of a sample, named by the experiment with step(), reported if it hangs
let currentStep = ''
export const step = (name: string) => { currentStep = name }

const watchdog = async (variant: string, i: number, fn: () => Promise<Sample>, ms: number) => {
  let timer: NodeJS.Timeout | undefined
  currentStep = ''
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`watchdog: variant ${variant}, run ${i}, step "${currentStep}" did not end in ${ms}ms`)), ms)
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}

export const runInterleaved = async (
  variants: string[],
  runs: number,
  fn: (variant: string, i: number) => Promise<Sample>,
  warmup = 1,
  timeoutMs = 120000
): Promise<Results> => {
  const results: Results = Object.fromEntries(variants.map(v => [v, []]))
  for (let w = 0; w < warmup; w++) for (const v of variants) await watchdog(v, -1, () => fn(v, -1), timeoutMs)
  for (let i = 0; i < runs; i++) {
    const order = variants.map((_, k) => variants[(k + i) % variants.length])
    for (const v of order) results[v].push(await watchdog(v, i, () => fn(v, i), timeoutMs))
    process.stdout.write('.')
  }
  process.stdout.write('\n')
  return results
}

const fmt = (x: number) => Number.isNaN(x) ? '-' : Math.abs(x) >= 100 ? Math.round(x).toString() : x.toFixed(1)

// one table: a row per variant, a column per metric, median [min-max] and the ratio to the first
// variant. Boolean metrics are shown as a rate.
export const report = (title: string, results: Results, metrics: string[]) => {
  const variants = Object.keys(results)
  const base = variants[0]
  const rows = [['variant', ...metrics]]
  for (const v of variants) {
    const row = [v]
    for (const m of metrics) {
      const values = results[v].map(s => s[m])
      if (typeof values[0] === 'boolean') {
        row.push(`${values.filter(Boolean).length}/${values.length}`)
        continue
      }
      if (typeof values[0] === 'string') {
        row.push([...new Set(values)].join(','))
        continue
      }
      const agg = aggregate(values.filter(x => typeof x === 'number') as number[])
      let cell = `${fmt(agg.median)} [${fmt(agg.min)}-${fmt(agg.max)}]`
      if (v !== base) {
        const b = aggregate(results[base].map(s => s[m]).filter(x => typeof x === 'number') as number[])
        cell += ' ' + compare(b, agg)
      }
      row.push(cell)
    }
    rows.push(row)
  }
  const widths = rows[0].map((_, c) => Math.max(...rows.map(r => r[c].length)))
  const line = (r: string[]) => '| ' + r.map((cell, c) => cell.padEnd(widths[c])).join(' | ') + ' |'
  const out = [`\n### ${title}\n`, line(rows[0]), '|' + widths.map(w => '-'.repeat(w + 2)).join('|') + '|', ...rows.slice(1).map(line)].join('\n')
  console.log(out)
  return out
}

const sha = () => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() + (execSync('git status --porcelain', { encoding: 'utf8' }).trim() ? '-dirty' : '')
  } catch { return 'unknown' }
}

export const save = (experiment: string, data: unknown) => {
  const dir = path.join(import.meta.dirname, '..', 'results')
  const file = path.join(dir, `${experiment}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(file, JSON.stringify({ experiment, commit: sha(), date: new Date().toISOString(), data }, null, 2))
  console.log(`\nsaved ${path.relative(process.cwd(), file)}`)
}
