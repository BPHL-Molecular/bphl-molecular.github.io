import { mkdir, writeFile, readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

// Run with the Vite development server running and the original GLB in src/assets/3D.
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage()
  await page.goto((process.env.BASE_URL || 'http://127.0.0.1:5173') + '/team')
  const samples = await page.evaluate(async () => {
    const { sampleGLB } = await import('/scripts/sampleGLB.mjs')
    const { VISUAL_CONFIG } = await import('/src/config/visual.js')
    const result = []
    for (const count of [VISUAL_CONFIG.particleCount, VISUAL_CONFIG.reducedParticleCount]) {
      const points = await sampleGLB('/src/assets/3D/corona_virus.glb', count)
      result.push({ count, points: Array.from(points) })
    }
    return result
  })
  const directory = new URL('../src/assets/points/', import.meta.url)
  await mkdir(directory, { recursive: true })
  for (const { count, points } of samples) {
    assert.equal(points.length, count * 3)
    assert.ok(points.every(Number.isFinite))
    const bytes = Buffer.alloc(points.length * 4)
    points.forEach((value, index) => bytes.writeFloatLE(value, index * 4))
    const file = new URL(`pathogen-${count}.bin`, directory)
    await writeFile(file, bytes)
    const saved = await readFile(file)
    points.forEach((value, index) => assert.equal(saved.readFloatLE(index * 4), value))
    console.log(`${count} points: ${saved.length} bytes; every coordinate matches the GLB sample.`)
  }
} finally {
  await browser.close()
}
