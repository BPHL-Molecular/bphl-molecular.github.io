import { seededRandom, orderPoints } from './normalizePointCloud.js'
export default function generateBlob(count, bacterium = false) {
  const random = seededRandom(bacterium ? 32 : 20),
    points = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const y = random() * 2 - 1,
      theta = random() * Math.PI * 2,
      ring = Math.sqrt(1 - y * y)
    const noise = bacterium
      ? 1 + 0.13 * Math.sin(theta * 3 + y * 4) + 0.08 * Math.cos(theta * 5 - y * 3)
      : 1
    let x = ring * Math.cos(theta) * noise,
      z = ring * Math.sin(theta) * noise
    let py = y * (bacterium ? 2.35 : 2.15)
    x *= bacterium ? 0.82 : 2.15
    z *= bacterium ? 0.82 : 2.15
    if (bacterium && i % 7 === 0) {
      const filament = Math.floor(random() * 26),
        t = random(),
        a = filament * 2.4
      py = ((filament % 9) / 8 - 0.5) * 3.5 + Math.sin(t * 5 + a) * 0.2
      x = Math.cos(a) * (0.7 + t * 0.9)
      z = Math.sin(a) * (0.7 + t * 0.9) + Math.sin(t * 8) * 0.1
    }
    const scatter = !bacterium && i % 12 === 0 ? 1 + Math.pow(random(), 2) * 0.22 : 1
    points.set([(x + (bacterium ? py * 0.17 : 0)) * scatter, py * scatter, z * scatter], i * 3)
  }
  return orderPoints(points)
}
