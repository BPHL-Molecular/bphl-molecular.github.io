import test from 'node:test'
import assert from 'node:assert/strict'
import generateDNA from '../src/lib/generateDNA.js'
import generateNetwork from '../src/lib/generateNetwork.js'
import generateBlob from '../src/lib/generateBlob.js'
import generateSequencing from '../src/lib/generateSequencing.js'
import normalizePointCloud from '../src/lib/normalizePointCloud.js'
import {
  parseSessions,
  readTrainingCache,
  writeTrainingCache,
  TRAINING_CACHE_KEY,
} from '../src/lib/training.js'

test('all generated targets have finite, equal-sized buffers', () => {
  for (const count of [14000, 38000]) {
    for (const points of [
      generateDNA(count),
      generateBlob(count),
      generateBlob(count, true),
      generateSequencing(count),
      generateNetwork(count).points,
    ]) {
      assert.equal(points.length, count * 3)
      assert.ok(points.every(Number.isFinite))
    }
  }
})

test('DNA distributes particles evenly between its two strands', () => {
  const points = generateDNA(38000)
  let first = 0,
    second = 0
  for (let i = 0; i < points.length; i += 3) {
    const x = (points[i] * 0.978 - points[i + 1] * 0.208) / (0.978 ** 2 + 0.208 ** 2)
    const y = (points[i] * 0.208 + points[i + 1] * 0.978) / (0.978 ** 2 + 0.208 ** 2)
    const z = points[i + 2]
    if (Math.hypot(x, z) < 0.95) continue
    const phase = Math.atan2(z, x) - (y / 5.8 + 0.5) * Math.PI * 4.6
    if (Math.cos(phase) > 0) first++
    else second++
  }
  assert.ok(first / second > 0.9 && first / second < 1.1)
})

test('network includes every node and has no duplicate edges', () => {
  const { lines } = generateNetwork(14000)
  const edges = new Set(),
    nodes = new Set()
  for (let i = 0; i < lines.length; i += 6) {
    const a = Array.from(lines.slice(i, i + 3)).join(',')
    const b = Array.from(lines.slice(i + 3, i + 6)).join(',')
    nodes.add(a)
    nodes.add(b)
    edges.add([a, b].sort().join('|'))
  }
  assert.equal(nodes.size, 38)
  assert.equal(edges.size, lines.length / 6)
})

test('normalization rejects malformed geometry and centers valid geometry', () => {
  assert.throws(() => normalizePointCloud(new Float32Array([1, 2])))
  assert.throws(() => normalizePointCloud(new Float32Array([1, 2, NaN])))
  assert.throws(() => normalizePointCloud(new Float32Array([1, 2, 3]), 0))
  assert.deepEqual(
    Array.from(normalizePointCloud(new Float32Array([0, 0, 0, 2, 4, 6]), 6)),
    [-1, -2, -3, 1, 2, 3],
  )
})

const file = (name, extra = {}) => ({
  name,
  type: 'file',
  sha: 'same-content',
  html_url:
    'https://github.com/StaPH-B/southeast-region/blob/master/trainings/' + encodeURIComponent(name),
  ...extra,
})
const files = [
  file('20250804_Session52_Pipeline_Training_SeqSender.pdf'),
  file('20250901_Session53_Analysis.pptx'),
  file('README.md'),
  file('bad.pdf', { html_url: 'javascript:alert(1)' }),
]

test('training parser filters documents, sorts sessions, and uses unique keys', () => {
  const sessions = parseSessions(files)
  assert.equal(sessions.length, 2)
  assert.equal(sessions[0].session, 53)
  assert.equal(sessions[1].title, 'Pipeline Training SeqSender')
  assert.notEqual(sessions[0].id, sessions[1].id)
  assert.throws(() => parseSessions({ message: 'API error' }))
})

test('training cache rejects corrupt, expired, future, and unsafe entries', () => {
  const now = 2000000,
    data = parseSessions(files)
  const storage = (value) => ({ getItem: () => JSON.stringify(value) })
  assert.deepEqual(readTrainingCache(storage({ savedAt: now, data }), now), data)
  for (const entry of [
    { savedAt: now, data: {} },
    { savedAt: 0, data },
    { savedAt: now + 1, data },
    { savedAt: now, data: [{ ...data[0], url: 'https://example.com' }] },
  ]) {
    assert.equal(readTrainingCache(storage(entry), now), null)
  }
  assert.equal(readTrainingCache({ getItem: () => '{bad json' }), null)
})

test('disabled storage never prevents training content from being used', () => {
  const storage = {
    getItem() {
      throw new Error('Blocked')
    },
    setItem() {
      throw new Error('Quota')
    },
  }
  assert.equal(readTrainingCache(storage), null)
  assert.doesNotThrow(() => writeTrainingCache(storage, parseSessions(files)))
  let key
  writeTrainingCache(
    {
      setItem(value) {
        key = value
      },
    },
    [],
  )
  assert.equal(key, TRAINING_CACHE_KEY)
})
