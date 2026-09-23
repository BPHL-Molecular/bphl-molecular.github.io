import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useTrainingSessions from '../hooks/useTrainingSessions'
import { TRAINING_SOURCE } from '../lib/training'

export default function TrainingPage() {
  const { sessions, error, retry } = useTrainingSessions()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    if (!sessions) return null
    const needle = query.trim().toLowerCase()
    if (!needle) return sessions
    return sessions.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle),
    )
  }, [sessions, query])
  return (
    <section
      className="training standalone-page editorial-section wrap"
      aria-labelledby="training-title"
    >
      <Link className="text-link training-back" to="/#training">
        <span aria-hidden="true">←</span> Back to homepage training
      </Link>
      <div className="section-kicker">
        <span>Training</span>
        <span>Building skills together</span>
      </div>
      <div className="section-heading">
        <h1 id="training-title">
          Training
          <br />
          <em>materials.</em>
        </h1>
        <p>
          Slides from StaPH-B southeast-region office hours — pipeline walkthroughs, tool
          deep-dives, and skills sessions.
          <br />
          <span className="placeholder-note">
            Synced automatically from{' '}
            <a href={TRAINING_SOURCE} target="_blank" rel="noreferrer">
              github.com/StaPH-B/southeast-region
            </a>
            .
          </span>
        </p>
      </div>
      <div className="training-search">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search trainings by name…"
          aria-label="Search trainings by name"
        />
        {sessions && (
          <span className="training-count" aria-live="polite">
            {filtered.length} of {sessions.length} sessions
          </span>
        )}
      </div>
      {error && (
        <p className="training-status" role="alert">
          Couldn&rsquo;t load the live list ({error}). Browse all sessions directly on{' '}
          <a href={TRAINING_SOURCE} target="_blank" rel="noreferrer">
            GitHub
          </a>
          .
          <button
            className="training-retry"
            type="button"
            onClick={() => {
              retry()
            }}
          >
            Try again
          </button>
        </p>
      )}
      {!sessions && !error && (
        <p className="training-status" role="status">
          Loading sessions…
        </p>
      )}
      {sessions && filtered.length === 0 && (
        <p className="training-status">No sessions match &ldquo;{query}&rdquo;.</p>
      )}
      {filtered && filtered.length > 0 && (
        <div className="training-list">
          {filtered.map((item) => (
            <a
              key={item.id}
              className="training-row"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="training-date">{item.date || '—'}</span>
              <span className="training-session">
                {item.session ? 'Session ' + item.session : ''}
              </span>
              <span className="training-title">{item.title}</span>
              <span className="pipeline-link">
                View slides <span aria-hidden="true">↗</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
