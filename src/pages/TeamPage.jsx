import { useLocation, useNavigate } from 'react-router-dom'
import TeamMember from '../components/team/TeamMember'
import { team } from '../data/team'

export default function TeamPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const homeScrollY = location.state?.homeScrollY

  function returnToHomepageTeam() {
    navigate('/#team', { state: { restoreHomeScrollY: homeScrollY } })
  }

  return (
    <section
      className="team team-page standalone-page editorial-section wrap"
      aria-labelledby="team-page-title"
    >
      <div className="team-page-content">
        <div className="section-kicker">
          <span>Team</span>
          <span>People behind the possibilities</span>
        </div>
        <div className="section-heading">
          <h1 id="team-page-title">
            Curious minds.
            <br />
            <em>Common purpose.</em>
          </h1>
          <div className="team-intro">
            <p>
              A team of bioinformaticians building tools and supporting genomic public health across
              Florida.
            </p>
            <div className="team-summary">
              <span>{team.length} team members</span>
              <span>Genomics · Pipelines · Training</span>
            </div>
          </div>
        </div>
        <div className="team-grid">
          {team.map((member, index) => (
            <TeamMember key={member.name} index={index} member={member} />
          ))}
        </div>
        <button className="text-link team-return" type="button" onClick={returnToHomepageTeam}>
          Return to the homepage team section <span aria-hidden="true">←</span>
        </button>
      </div>
    </section>
  )
}
