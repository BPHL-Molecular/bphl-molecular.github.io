import { useEffect, useRef, useState } from 'react'
import { TRAINING_API, parseSessions, readTrainingCache, writeTrainingCache } from '../lib/training'

function storage() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export default function useTrainingSessions() {
  const [sessions, setSessions] = useState(() => readTrainingCache(storage()))
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const hasCache = useRef(sessions !== null)
  const [loading, setLoading] = useState(sessions === null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (hasCache.current && attempt === 0) return
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)])

    fetch(TRAINING_API, {
      signal,
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            response.status === 403 || response.status === 429
              ? 'GitHub is temporarily limiting requests. Please try again later.'
              : 'The training list is temporarily unavailable.',
          )
        }
        return response.json()
      })
      .then((files) => {
        if (signal.aborted) return
        const parsed = parseSessions(files)
        setSessions(parsed)
        writeTrainingCache(storage(), parsed)
        setLastUpdated(new Date())
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
      .catch((fetchError) => {
        if (!controller.signal.aborted) {
          setError(
            fetchError.name === 'TimeoutError'
              ? 'The request timed out. Please try again.'
              : fetchError.message,
          )
        }
      })

    return () => controller.abort()
  }, [attempt])

  return {
    sessions,
    error,
    loading,
    lastUpdated,
    retry: () => {
      if (loading) return
      setLoading(true)
      setError(null)
      setAttempt((value) => value + 1)
    },
  }
}
