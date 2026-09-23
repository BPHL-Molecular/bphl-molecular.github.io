import { useState } from 'react'

export default function TeamMember({ member, index }) {
  const [flipped, setFlipped] = useState(false)
  const profileNumber = String(index + 1).padStart(2, '0')

  return (
    <article className="team-member">
      <button
        type="button"
        className={`team-card${flipped ? ' is-flipped' : ''}`}
        aria-label={`${member.name}, ${member.role} — ${flipped ? 'Return to portrait' : 'View profile'}`}
        aria-pressed={flipped}
        onClick={() => setFlipped((current) => !current)}
      >
        <span className="team-card-inner">
          <span className="team-card-face team-card-front" aria-hidden={flipped}>
            <span className={`team-image portrait-${index % 3}`}>
              {member.image ? (
                <img src={member.image} alt="" loading="lazy" />
              ) : (
                <>
                  <span className="portrait-silhouette" aria-hidden="true" />
                  <span className="portrait-label">Portrait forthcoming / {profileNumber}</span>
                </>
              )}
            </span>
            <span className="member-name">
              {member.name}
              <span className="member-profile-arrow" aria-hidden="true">
                →
              </span>
            </span>
            <span className="member-role">{member.role}</span>
          </span>

          <span className="team-card-face team-card-back" aria-hidden={!flipped}>
            <span className="team-card-number">Profile / {profileNumber}</span>
            <span className="member-name">{member.name}</span>
            <span className="member-role">{member.role}</span>
            <span className="member-description">{member.description}</span>
            <span className="team-card-action team-card-return">
              Return to portrait <span aria-hidden="true">↙</span>
            </span>
          </span>
        </span>
      </button>
    </article>
  )
}
