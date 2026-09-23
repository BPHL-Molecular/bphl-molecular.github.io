import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { decodePointCloud } from '../src/lib/readPointCloud.js'
import { VISUAL_CONFIG } from '../src/config/visual.js'

test('saved pathogen assets cover both configured particle counts', async () => {
  for (const count of [VISUAL_CONFIG.particleCount, VISUAL_CONFIG.reducedParticleCount]) {
    const file = await readFile(
      new URL(`../src/assets/points/pathogen-${count}.bin`, import.meta.url),
    )
    const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
    const points = decodePointCloud(buffer, count)
    assert.equal(points.length, count * 3)
    assert.ok(points.every(Number.isFinite))
    assert.ok(Math.max(...points) - Math.min(...points) > 4)
  }
})

test('point cloud decoder rejects missing, truncated, and non-finite data', () => {
  assert.throws(() => decodePointCloud(new ArrayBuffer(0), 0))
  assert.throws(() => decodePointCloud(new ArrayBuffer(8), 1))
  const buffer = new ArrayBuffer(12)
  new DataView(buffer).setFloat32(0, NaN, true)
  assert.throws(() => decodePointCloud(buffer, 1))
})
