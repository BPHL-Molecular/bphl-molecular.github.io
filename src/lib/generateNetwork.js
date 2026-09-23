import { seededRandom, orderPoints } from './normalizePointCloud.js'
export default function generateNetwork(count) {
  const random = seededRandom(72),
    nodes = [],
    edges = []
  for (let i = 0; i < 38; i++) {
    const angle = i * 2.39996,
      radius = 0.6 + Math.sqrt(i / 38) * 1.8
    nodes.push([Math.cos(angle) * radius, Math.sin(angle) * radius, (random() - 0.5) * 2])
  }
  const seenEdges = new Set()
  for (let i = 0; i < nodes.length; i++) {
    const nearest = nodes
      .map((p, j) => ({ j, d: p.reduce((sum, n, k) => sum + (n - nodes[i][k]) ** 2, 0) }))
      .filter((p) => p.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
    nearest.forEach(({ j }) => {
      const a = Math.min(i, j),
        b = Math.max(i, j)
      const key = a + ':' + b
      if (!seenEdges.has(key)) {
        seenEdges.add(key)
        edges.push([a, b])
      }
    })
  }
  const points = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    if (i % 4 === 0) {
      const [a, b] = edges[Math.floor(i / 4) % edges.length],
        t = random()
      points.set(
        nodes[a].map((v, k) => v + (nodes[b][k] - v) * t),
        i * 3,
      )
    } else {
      const node = nodes[i % nodes.length],
        u = random() * Math.PI * 2,
        y = random() * 2 - 1,
        r = 0.065 + random() * 0.055
      points.set(
        [
          node[0] + Math.cos(u) * r * Math.sqrt(1 - y * y),
          node[1] + y * r,
          node[2] + Math.sin(u) * r,
        ],
        i * 3,
      )
    }
  }
  return {
    points: orderPoints(points),
    lines: new Float32Array(edges.flatMap(([a, b]) => [...nodes[a], ...nodes[b]])),
  }
}
