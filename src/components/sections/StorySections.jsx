import { Link } from 'react-router-dom'
import { heroTags } from '../../data/homeContent'

const chapters = [
  {
    id: 'hero',
    label: 'THE GENOMIC WORLD',
    title: (
      <>
        A World of Data
        <br />
        <em>Written in DNA</em>
      </>
    ),
    copy: (
      <>
        Every pathogen carries genetic information. We use bioinformatics to turn that information
        into knowledge that supports public health across Florida.
      </>
    ),
    context: ['The world is connected.', 'So is its data.'],
  },
  {
    id: 'pathogens',
    label: '02 — Pathogen surveillance',
    title: (
      <>
        <span className="title-no-wrap">Tracking Pathogens</span>
        <br />
        <em>See the Invisible</em>
      </>
    ),
    copy: (
      <>
        We use genomic sequencing to identify and compare pathogens, monitor how they change, and
        support investigations across Florida.
      </>
    ),
    context: ['A closer look', 'at the pathogens affecting our communities.'],
    bottom: 'Each sequence helps us see the bigger picture.',
  },
  {
    id: 'sequencing',
    label: '03 — Sequencing & analysis',
    title: (
      <>
        <span className="title-no-wrap">Turn Raw Sequences</span>
        <br />
        <em>Into Insight</em>
      </>
    ),
    copy: (
      <>
        Our pipelines check sequence quality, identify organisms, and organize complex genomic data
        into results that public health teams can use.
      </>
    ),
    context: ['Four letters.', 'A world of information.'],
    bottom: 'Good analysis starts with reliable data.',
  },
  {
    id: 'network',
    label: '04 — CONNECTING THE RESULTS',
    title: (
      <>
        Finding Patterns
        <br />
        <em>Across Samples</em>
      </>
    ),
    copy: (
      <>
        By comparing sequences across samples, we can identify important similarities and
        differences and provide context for public health investigations.
      </>
    ),
    context: ['Individual insights.', 'Collective understanding.'],
    bottom: 'Patterns become clearer when the data comes together.',
  },
  {
    id: 'florida',
    label: '05 — SUPPORTING FLORIDA',
    title: (
      <>
        Better Tools
        <br />
        <span className="title-transition">Stronger Labs</span>
        <br />
        <em>A Healthier Florida</em>
      </>
    ),
    copy: (
      <>
        We build tools, provide training, and share resources that help public health laboratories
        use bioinformatics in their everyday work.
      </>
    ),
    context: ['Built for public health.', 'Shared across Florida.'],
    bottom: 'For Florida’s laboratories and the communities we serve.',
  },
]
export default function StorySections() {
  return chapters.map((chapter, index) => (
    <section
      className={`story-section chapter-${index}`}
      id={chapter.id}
      key={chapter.id}
      aria-labelledby={`${chapter.id}-title`}
    >
      <div className="story-copy">
        <div className="eyebrow">
          <span className="status-dot" />
          {chapter.label}
        </div>
        {index === 0 ? (
          <h1 id={`${chapter.id}-title`}>{chapter.title}</h1>
        ) : (
          <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>
        )}
        <p>{chapter.copy}</p>
        {index === 0 && (
          <div className="hero-actions">
            <a className="hero-primary" href="#research">
              Our Work <span aria-hidden="true">↗</span>
            </a>
            <a className="hero-secondary" href="#about">
              Learn more
            </a>
          </div>
        )}
        {index === 4 && (
          <a className="pill-link" href="#research">
            Explore Our Work <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <aside className="story-context" aria-hidden="true">
        <p>
          <span className="story-context-first-line">{chapter.context[0]}</span>
          <br />
          {chapter.context[1]}
        </p>
        <div className="context-line" />
      </aside>
      {index === 0 && (
        <div className="hero-metadata">
          <span>FLORIDA / GENOMICS / DATA / PUBLIC HEALTH</span>
          <div className="hero-chips">
            {heroTags.map(({ label, to }) => (
              <Link to={to} key={label}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="story-bottom">
        <a href={index < 4 ? `#${chapters[index + 1].id}` : '#about'}>
          <span className="scroll-circle">↓</span>
          {index === 0 ? 'Scroll to explore' : 'Continue the story'}
        </a>
        {chapter.bottom && <span>{chapter.bottom}</span>}
        <span className="chapter-count">0{index + 1} / 05</span>
      </div>
    </section>
  ))
}
