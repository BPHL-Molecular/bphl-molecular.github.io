// Decisions use rendered frame intervals, not device names or viewport width.
export const QUALITY_LEVELS = [
  { count: 14000, dpr: 1 },
  { count: 38000, dpr: 1.25 },
  { count: 38000, dpr: 1.7 },
]
export function pixelRatioFor(level, width, height, deviceRatio, maxBuffer = 4096) {
  const area = Math.max(1, width * height)
  return Math.max(
    0.5,
    Math.min(
      QUALITY_LEVELS[level].dpr,
      deviceRatio,
      Math.sqrt(2_000_000 / area),
      maxBuffer / Math.max(1, width, height),
    ),
  )
}
export function createQualitySampler(initial = 1) {
  let level = initial,
    total = 0,
    samples = 0,
    slow = 0,
    fast = 0,
    lastChange = 0
  let average = 0
  return {
    get average() {
      return average
    },
    sample(milliseconds, now, settled = true) {
      if (milliseconds <= 0 || milliseconds > 100) return null
      total += milliseconds
      samples++
      if (samples < 120) return null
      average = total / samples
      total = 0
      samples = 0
      slow = average > 23 ? slow + 1 : 0
      fast = average < 17.5 ? fast + 1 : 0
      if (!settled || now - lastChange < 10000) return null
      const next = slow >= 2 ? Math.max(0, level - 1) : fast >= 4 ? Math.min(2, level + 1) : level
      if (next === level) return null
      level = next
      slow = 0
      fast = 0
      lastChange = now
      return level
    },
    reset() {
      total = 0
      samples = 0
      slow = 0
      fast = 0
    },
  }
}
