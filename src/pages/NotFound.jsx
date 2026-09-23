import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <section className="editorial-section standalone-page wrap" aria-labelledby="not-found-title">
      <div className="section-kicker">
        <span>404</span>
      </div>
      <h1 id="not-found-title">Page not found.</h1>
      <p className="training-status">
        The address may have changed. Return to the homepage to find our research, team, and
        training materials.
      </p>
      <Link className="text-link" to="/">
        Back to home <span aria-hidden="true">?</span>
      </Link>
    </section>
  )
}
