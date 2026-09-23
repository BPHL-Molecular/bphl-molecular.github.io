import { seededRandom, orderPoints } from './normalizePointCloud.js'
// SEQUENCING CONTENT — illustrative reference, read spans, and highlighted variant.
// All read endpoints use the same base-column grid; letters and particles share this data.
export const SEQUENCE = {
  reference: 'ACGTACGTACGTACGT',
  step: 0.31,
  rowGap: 0.43,
  top: 1.65,
  variant: 11,
  reads: [
    [0, 15],
    [2, 13],
    [1, 14],
    [4, 15],
    [0, 10],
    [3, 14],
    [1, 12],
    [5, 15],
    [2, 14],
  ],
}
export const baseX = (column) => (column - (SEQUENCE.reference.length - 1) / 2) * SEQUENCE.step
export const readY = (row) => SEQUENCE.top - row * SEQUENCE.rowGap
export default function generateSequencing(count) {
  const random = seededRandom(44),
    points = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const row = i % SEQUENCE.reads.length
    const [start, end] = SEQUENCE.reads[row]
    const column = start + Math.floor(random() * (end - start + 1))
    const angle = random() * Math.PI * 2
    const radius = 0.085 * Math.sqrt(random())
    let x = baseX(column) + (random() - 0.5) * 0.285
    let y = readY(row) + Math.cos(angle) * radius
    let z = Math.sin(angle) * radius
    // A little breakup at the read starts suggests particles assembling into data.
    if (i % 13 === 0) {
      const drift = random()
      x = baseX(start) - drift * 0.65
      y += (random() - 0.5) * 0.32 * drift
      z += (random() - 0.5) * 0.3
    }
    points.set([x, y, z], i * 3)
  }
  return orderPoints(points)
}
