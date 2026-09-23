import { seededRandom, orderPoints } from './normalizePointCloud.js'
export default function generateDNA(count) {
  const random = seededRandom(11),
    points = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const rung = i % 4 === 0
    const height = rung ? Math.floor(random() * 35) / 34 : random()
    const t = height * Math.PI * 4.6,
      angle = t + (Math.floor(i / 4) % 2) * Math.PI
    const tubeAngle = random() * Math.PI * 2,
      tube = 0.105 * Math.sqrt(random())
    const radius = 1.04 + tube * Math.cos(tubeAngle)
    let x = radius * Math.cos(angle),
      y = (height - 0.5) * 5.8 + tube * Math.sin(tubeAngle),
      z = radius * Math.sin(angle)
    if (rung) {
      const ratio = random() * 2 - 1
      x = Math.cos(t) * ratio
      z = Math.sin(t) * ratio
      y += (random() - 0.5) * 0.065
    }
    // Tilt the helix by 12 degrees.
    points.set([x * 0.978 + y * 0.208, y * 0.978 - x * 0.208, z], i * 3)
  }
  return orderPoints(points)
}
