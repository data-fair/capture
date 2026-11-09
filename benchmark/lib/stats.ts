export type Agg = { n: number, median: number, p90: number, min: number, max: number, mean: number }

export const aggregate = (samples: number[]): Agg => {
  if (!samples.length) return { n: 0, median: NaN, p90: NaN, min: NaN, max: NaN, mean: NaN }
  const s = [...samples].sort((a, b) => a - b)
  const q = (p: number) => {
    const i = (s.length - 1) * p
    const lo = Math.floor(i)
    const hi = Math.ceil(i)
    return s[lo] + (s[hi] - s[lo]) * (i - lo)
  }
  return { n: s.length, median: q(0.5), p90: q(0.9), min: s[0], max: s[s.length - 1], mean: s.reduce((a, b) => a + b, 0) / s.length }
}

// a variant is flagged against the baseline only when the min-max ranges do not overlap and the
// medians differ by more than 10%, the rule of the data-fair harness: noise on a loaded dev
// machine is large and a single median is not evidence
export const compare = (base: Agg, other: Agg) => {
  if (!base.n || !other.n) return ''
  const ratio = other.median / base.median
  const disjoint = other.max < base.min || other.min > base.max
  if (!disjoint || Math.abs(ratio - 1) < 0.1) return `x${ratio.toFixed(2)}`
  return `x${ratio.toFixed(2)} ${ratio < 1 ? 'LOWER' : 'HIGHER'}`
}
