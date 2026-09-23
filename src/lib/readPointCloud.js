export function decodePointCloud(buffer, count) {
  if (!Number.isInteger(count) || count <= 0 || buffer.byteLength !== count * 3 * 4) {
    throw new Error('Point cloud size does not match the particle count.')
  }
  const view = new DataView(buffer)
  const points = new Float32Array(count * 3)
  for (let index = 0; index < points.length; index++) {
    const value = view.getFloat32(index * 4, true)
    if (!Number.isFinite(value)) throw new Error('Invalid point coordinate.')
    points[index] = value
  }
  return points
}

export default async function readPointCloud(url, count) {
  if (!url) throw new Error(`No saved pathogen points for ${count} particles.`)
  const response = await fetch(url)
  if (!response.ok) throw new Error('Pathogen points could not be loaded.')
  return decodePointCloud(await response.arrayBuffer(), count)
}
