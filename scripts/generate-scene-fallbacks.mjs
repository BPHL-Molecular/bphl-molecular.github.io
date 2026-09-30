import { readFile, writeFile, mkdir } from 'node:fs/promises'
import generateBlob from '../src/lib/generateBlob.js'
import generateDNA from '../src/lib/generateDNA.js'
import generateSequencing from '../src/lib/generateSequencing.js'
import generateNetwork from '../src/lib/generateNetwork.js'
import { decodePointCloud } from '../src/lib/readPointCloud.js'
const saved = await readFile(new URL('../src/assets/points/pathogen-14000.bin', import.meta.url))
const network = generateNetwork(1800)
const shapes = {
  sphere: generateBlob(1800),
  dna: generateDNA(1800),
  pathogen: decodePointCloud(
    saved.buffer.slice(saved.byteOffset, saved.byteOffset + saved.byteLength),
    14000,
  ),
  sequence: generateSequencing(1800),
  network: network.points,
}
const output = new URL('../src/assets/fallbacks/', import.meta.url)
await mkdir(output, { recursive: true })
for (const [name, points] of Object.entries(shapes)) {
  const step = Math.max(1, Math.floor(points.length / 3 / 1800))
  let marks = ''
  if (name === 'network') {
    for (let i = 0; i < network.lines.length; i += 6) {
      marks += `<path d="M${(160 + network.lines[i] * 45).toFixed(1)} ${(160 - network.lines[i + 1] * 45).toFixed(1)}L${(160 + network.lines[i + 3] * 45).toFixed(1)} ${(160 - network.lines[i + 4] * 45).toFixed(1)}" stroke="#789e94" stroke-width=".6"/>`
    }
  }
  for (let i = 0; i < points.length; i += step * 3) {
    const depth = Math.max(0.3, Math.min(1, (points[i + 2] + 3) / 6))
    const fill = name === 'sphere' && Math.abs(points[i]) < 1.5 ? '#d8d2be' : '#376e68'
    marks += `<circle cx="${(160 + points[i] * 45).toFixed(1)}" cy="${(160 - points[i + 1] * 45).toFixed(1)}" r="${(1 + depth).toFixed(1)}" fill="${fill}" opacity="${depth.toFixed(2)}"/>`
  }
  await writeFile(
    new URL(name + '.svg', output),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">${marks}</svg>`,
  )
}
