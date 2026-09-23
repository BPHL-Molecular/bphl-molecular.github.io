import { Link, useNavigate } from 'react-router-dom'
import { team } from '../../data/team'

const highlights = team.slice(0, 3)

const teamCategories = ['Bioinformatics', 'Genomic Surveillance', 'Training & Support']

export default function Team() {
  const navigate = useNavigate()

  function openFullTeam(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    event.preventDefault()
    navigate('/team', { state: { homeScrollY: window.scrollY } })
  }

  return (
    <section id="team" className="team editorial-section wrap" aria-labelledby="team-title">
      <div className="section-kicker">
        <span>04 / MEET THE TEAM</span>
        <span>THE PEOPLE BEHIND THE WORK</span>
      </div>

      <div className="team-compact">
        <div className="section-heading team-compact-heading">
          <h2 id="team-title">
            Shared knowledge.
            <br />
            <em>New possibilities.</em>
          </h2>

          <p>
            Our team brings together experience in microbiology, genomics, software development, and
            public health.
            <br />
            <span className="placeholder-note">
              Meet the people who develop the tools, support the laboratories, and help move the
              work forward.
            </span>
          </p>
        </div>

        <div className="team-faces">
          {highlights.map(({ name, image }, index) => (
            <div className="team-face" key={name ?? teamCategories[index]}>
              <div className={`team-face-image portrait-${index % 3}`}>
                {image ? (
                  <img
                    src={image}
                    alt={name ? `${name} — ${teamCategories[index]}` : ''}
                    loading="lazy"
                  />
                ) : (
                  <div className="portrait-silhouette" aria-hidden="true" />
                )}
              </div>

              <span>{teamCategories[index]}</span>
            </div>
          ))}

          <Link to="/team" className="team-face team-face-more" onClick={openFullTeam}>
            <span className="team-face-image team-face-count" aria-hidden="true">
              +{team.length - highlights.length}
            </span>
            <span>View Full Team</span>
          </Link>
        </div>
      </div>

      <Link className="text-link team-link" to="/team" onClick={openFullTeam}>
        Meet the team <span aria-hidden="true">↗</span>
      </Link>
    </section>
  )
}
