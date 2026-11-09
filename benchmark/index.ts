import { parseArgs } from 'node:util'
import { experiments } from './experiments/index.ts'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    runs: { type: 'string', default: '8' },
    browser: { type: 'string', default: 'chrome-stable' }
  }
})

const name = positionals[0]
if (!name || !(name in experiments || name === 'all')) {
  console.log(`usage: npm run benchmark -- <experiment|all> [--runs=8] [--browser=chrome-stable|cft|shell]\n\nexperiments:\n${Object.entries(experiments).map(([k, e]) => `  ${k.padEnd(12)} ${e.description}`).join('\n')}`)
  process.exit(name ? 1 : 0)
}

const opts = { runs: Number(values.runs), browser: values.browser }
for (const [k, e] of Object.entries(experiments)) {
  if (name !== 'all' && k !== name) continue
  console.log(`\n## ${k}: ${e.description}`)
  await e.run(opts)
}
