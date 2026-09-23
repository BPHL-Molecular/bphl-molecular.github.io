export const TRAINING_SOURCE =
  'https://github.com/StaPH-B/southeast-region/tree/master/trainings/office%20hours'
export const TRAINING_API =
  'https://api.github.com/repos/StaPH-B/southeast-region/contents/trainings/office%20hours?ref=master'
export const TRAINING_CACHE_KEY = 'bphl-training-sessions-v2'
const CACHE_TTL = 30 * 60 * 1000
const DOCUMENT_EXTENSION = /\.(pdf|pptx?|docx?)$/i

function validURL(value) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      url.pathname.startsWith('/StaPH-B/southeast-region/')
    )
  } catch {
    return false
  }
}

function validSession(item) {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.title === 'string' &&
    validURL(item.url) &&
    (item.date === null || /^\d{4}-\d{2}-\d{2}$/.test(item.date)) &&
    (item.session === null || Number.isInteger(item.session))
  )
}

export function parseSessions(files) {
  if (!Array.isArray(files)) throw new Error('Unexpected response from GitHub.')
  return files
    .filter(
      (file) =>
        file?.type === 'file' &&
        typeof file.name === 'string' &&
        DOCUMENT_EXTENSION.test(file.name) &&
        typeof file.sha === 'string' &&
        validURL(file.html_url),
    )
    .map((file) => {
      const date = file.name.match(/^(\d{4})(\d{2})(\d{2})/)
      const session = file.name.match(/session\s*0*(\d+)/i)
      const title = file.name
        .replace(/^\d{8}_?/, '')
        .replace(/session\s*\d+\s*[-_]?\s*/i, '')
        .replace(DOCUMENT_EXTENSION, '')
        .replace(/_+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return {
        id: file.sha + ':' + file.name,
        name: file.name,
        title: title || file.name,
        url: file.html_url,
        date: date ? `${date[1]}-${date[2]}-${date[3]}` : null,
        session: session ? Number(session[1]) : null,
      }
    })
    .sort(
      (a, b) =>
        (b.date || '').localeCompare(a.date || '') ||
        (b.session || 0) - (a.session || 0) ||
        a.name.localeCompare(b.name),
    )
}

export function readTrainingCache(storage, now = Date.now()) {
  try {
    const cached = JSON.parse(storage.getItem(TRAINING_CACHE_KEY))
    if (
      !cached ||
      !Number.isFinite(cached.savedAt) ||
      cached.savedAt > now ||
      now - cached.savedAt >= CACHE_TTL ||
      !Array.isArray(cached.data) ||
      !cached.data.every(validSession)
    )
      return null
    return cached.data
  } catch {
    return null
  }
}

export function writeTrainingCache(storage, data) {
  try {
    storage.setItem(TRAINING_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    /* Storage may be disabled or full; the fetched list is still usable. */
  }
}
