import neostandard from 'neostandard'
import dfLibRecommended from '@data-fair/lib-utils/eslint/recommended.js'

export default [
  { ignores: ['**/.type/'] },
  ...dfLibRecommended,
  ...neostandard({ ts: true }),
  {
    // server code logs through @data-fair/lib-node/log.js (its README, "Logging")
    files: ['api/**/*.ts'],
    rules: { 'no-console': 'error' }
  }
]
