import sampleFlorida from './sampleFlorida.js'
import readPointCloud from './readPointCloud.js'

const cache = new Map()
const MAX_ENTRIES = 6

export default function loadPointCloud(type, url, count) {
  const key = JSON.stringify([type, url, count])
  if (cache.has(key)) return cache.get(key)
  const load = type === 'svg' ? sampleFlorida : readPointCloud
  const pending = load(url, count).catch((error) => {
    if (cache.get(key) === pending) cache.delete(key)
    throw error
  })
  cache.set(key, pending)
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value)
  return pending
}
