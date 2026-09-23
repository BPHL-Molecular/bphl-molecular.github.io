import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './PipelinesPage.css'

const source = 'https://github.com/BPHL-Molecular'

export default function PipelinesPage() {
  const [repositories, setRepositories] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    async function load() {
      const all = []
      for (let page = 1; ; page++) {
        const response = await fetch(
          `https://api.github.com/orgs/BPHL-Molecular/repos?type=public&sort=updated&direction=desc&per_page=100&page=${page}`,
          { signal, headers: { Accept: 'application/vnd.github+json' } },
        )
        if (!response.ok)
          throw new Error(
            response.status === 403 || response.status === 429
              ? 'GitHub is temporarily limiting requests. Please try again later.'
              : 'The repository list is temporarily unavailable.',
          )
        const data = await response.json()
        if (!Array.isArray(data)) throw new Error('Unexpected response from GitHub.')
        all.push(
          ...data.filter(
            (repo) =>
              typeof repo.name === 'string' &&
              repo.owner?.login?.toLowerCase() === 'bphl-molecular' &&
              !repo.private,
          ),
        )
        if (data.length < 100) break
      }
      if (!signal.aborted)
        setRepositories(
          all.sort(
            (a, b) =>
              (b.updated_at || '').localeCompare(a.updated_at || '') ||
              a.name.localeCompare(b.name),
          ),
        )
    }
    load().catch((failure) => {
      if (!controller.signal.aborted)
        setError(
          failure.name === 'TimeoutError'
            ? 'GitHub took too long to respond. Please try again.'
            : failure.message,
        )
    })
    return () => controller.abort()
  }, [attempt])

  const needle = query.trim().toLowerCase()
  const filtered = repositories?.filter((repo) =>
    [repo.name, repo.description, repo.language, ...(repo.topics || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(needle),
  )

  return (
    <section
      className="pipeline-directory standalone-page editorial-section wrap"
      aria-labelledby="pipelines-title"
    >
      <Link className="text-link" to="/#bioinformatics-pipelines">
        ← Back to homepage pipelines
      </Link>
      <div className="section-heading">
        <h1 id="pipelines-title">
          Pipelines &amp;
          <br />
          <em>repositories.</em>
        </h1>
        <p>
          Explore our public pipelines, tools, and supporting code. Pulled from{' '}
          <a href={source} target="_blank" rel="noreferrer">
            BPHL-Molecular on GitHub
          </a>
          , most recently updated first.
        </p>
      </div>
      <div className="training-search">
        <input
          type="search"
          aria-label="Search repositories"
          placeholder="Search by name, description, language, or topic"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {repositories && (
          <span className="training-count" aria-live="polite">
            {filtered.length} of {repositories.length} repositories
          </span>
        )}
      </div>
      {error && (
        <p className="training-status" role="alert">
          {error}{' '}
          <a href={source} target="_blank" rel="noreferrer">
            Browse on GitHub
          </a>
          <button
            type="button"
            className="training-retry"
            onClick={() => {
              setError('')
              setAttempt((value) => value + 1)
            }}
          >
            Try again
          </button>
        </p>
      )}
      {!repositories && !error && (
        <p className="training-status" role="status">
          Loading repositories…
        </p>
      )}
      {filtered?.length === 0 && (
        <p className="training-status">
          {query ? `No repositories match “${query}”.` : 'No public repositories are available.'}
        </p>
      )}
      <div className="pipeline-directory-list">
        {filtered?.map((repo) => (
          <a
            key={repo.id}
            className="pipeline-directory-row"
            href={`${source}/${encodeURIComponent(repo.name)}`}
            target="_blank"
            rel="noreferrer"
          >
            <div>
              <h2>{repo.name}</h2>
              <p>{repo.description || 'No description provided.'}</p>
              <div className="pipeline-directory-meta">
                {repo.language && <span>{repo.language}</span>}
                {repo.updated_at && (
                  <span>
                    Updated <time dateTime={repo.updated_at}>{repo.updated_at.slice(0, 10)}</time>
                  </span>
                )}
                {repo.archived && <span>Archived</span>}
                {repo.fork && <span>Fork</span>}
              </div>
            </div>
            <span className="pipeline-link">View on GitHub ↗</span>
          </a>
        ))}
      </div>
    </section>
  )
}
