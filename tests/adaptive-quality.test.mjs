import test from 'node:test'
import assert from 'node:assert/strict'
import { createQualitySampler, pixelRatioFor } from '../src/lib/adaptiveQuality.js'

test('quality requires sustained frame evidence, idle scrolling, and a cooldown', () => {
  const sampler = createQualitySampler(1)
  let now = 10000
  const window = (ms, settled = true) => {
    let result = null
    for (let i = 0; i < 120; i++) {
      now += ms
      result = sampler.sample(ms, now, settled)
    }
    return result
  }
  assert.equal(window(30), null)
  assert.equal(window(30, false), null, 'Never switch during an active scroll')
  assert.equal(window(30), 0)
  for (let i = 0; i < 4; i++) assert.equal(window(16), null, 'Cooldown blocks quick reversal')
  let upgraded = false
  for (let i = 0; i < 4; i++) upgraded ||= window(16) === 1
  assert.ok(upgraded)
  sampler.reset()
  assert.equal(sampler.sample(3000, now), null, 'Ignore suspension and resume gaps')
})
test('render resolution is bounded by canvas area and WebGL limits', () => {
  assert.equal(pixelRatioFor(2, 390, 240, 3), 1.7)
  assert.ok(pixelRatioFor(2, 2000, 1500, 3) < 1)
  assert.ok(pixelRatioFor(2, 1200, 600, 3, 1024) <= 1024 / 1200)
  assert.equal(pixelRatioFor(0, 390, 240, 3), 1)
})
