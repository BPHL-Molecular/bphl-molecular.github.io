export function seededRandom(seed = 1234) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export default function normalizePointCloud(points, size = 5.1) {
  if (!points.length || points.length % 3 !== 0)
    throw new Error('Point cloud must contain complete XYZ vertices.')
  if (!Number.isFinite(size) || size <= 0) throw new Error('Point cloud size must be positive.')
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < points.length; i++) {
    if (!Number.isFinite(points[i])) throw new Error('Invalid point coordinate.')
    const axis = i % 3
    min[axis] = Math.min(min[axis], points[i])
    max[axis] = Math.max(max[axis], points[i])
  }
  const extent = Math.max(...max.map((value, i) => value - min[i])) || 1
  const output = new Float32Array(points.length)
  for (let i = 0; i < points.length; i++) {
    const axis = i % 3
    output[i] = ((points[i] - (min[axis] + max[axis]) / 2) / extent) * size
  }
  return output
}
// Vertical correspondence keeps morphs coherent instead of turning every transition into a random cloud.
export function orderPoints(points) {
  const indices = Array.from({ length: points.length / 3 }, (_, i) => i)
  indices.sort((a, b) => points[a * 3 + 1] - points[b * 3 + 1] || points[a * 3] - points[b * 3])
  // Within thin height bands, pair nearby angles instead of random opposite sides.
  // This keeps blob-to-DNA particles flowing around the form rather than crossing its center.
  const bandSize = Math.max(16, Math.round(Math.sqrt(indices.length)))
  for (let start = 0; start < indices.length; start += bandSize) {
    const band = indices.slice(start, start + bandSize)
    band.sort(
      (a, b) =>
        Math.atan2(points[a * 3 + 2], points[a * 3]) - Math.atan2(points[b * 3 + 2], points[b * 3]),
    )
    for (let i = 0; i < band.length; i++) indices[start + i] = band[i]
  }
  const ordered = new Float32Array(points.length)
  indices.forEach((source, i) => ordered.set(points.subarray(source * 3, source * 3 + 3), i * 3))
  return ordered
}
