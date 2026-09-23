import { Link } from 'react-router-dom'
import { trainingContent } from '../../data/homeContent'
import useTrainingSessions from '../../hooks/useTrainingSessions'
import { TRAINING_SOURCE } from '../../lib/training'

export default function Training() {
  const { sessions, error } = useTrainingSessions()
  const recentSessions = sessions?.slice(0, 3)

  return (
    <section
      id="training"
      className="training-preview editorial-section wrap"
      aria-labelledby="training-preview-title"
    >
      <div className="section-kicker">
        <span>{trainingContent.kicker[0]}</span>
        <span>{trainingContent.kicker[1]}</span>
      </div>
      <div className="section-heading">
        <h2 id="training-preview-title">
          {trainingContent.title[0]}
          <br />
          <em>{trainingContent.title[1]}</em>
        </h2>
        <p>{trainingContent.description}</p>
      </div>
      {!sessions && !error && (
        <p className="training-status" role="status">
          Loading recent training materials…
        </p>
      )}
      {error && (
        <p className="training-status">
          Recent materials are temporarily unavailable. Browse the training library on{' '}
          <a href={TRAINING_SOURCE} target="_blank" rel="noreferrer">
            GitHub
          </a>
          .
        </p>
      )}
      {recentSessions && recentSessions.length > 0 && (
        <div className="training-list training-preview-list">
          {recentSessions.map((item) => (
            <a
              key={item.id}
              className="training-row"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="training-date">{item.date || '—'}</span>
              <span className="training-session">
                {item.session ? `Session ${item.session}` : 'Training'}
              </span>
              <span className="training-title">{item.title}</span>
              <span className="pipeline-link">
                Open material <span aria-hidden="true">↗</span>
              </span>
            </a>
          ))}
        </div>
      )}
      <Link className="text-link training-preview-link" to="/training">
        View all training materials <span aria-hidden="true">↗</span>
      </Link>
    </section>
  )
}
