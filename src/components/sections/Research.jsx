import { researchContent } from '../../data/homeContent'
import { Link } from 'react-router-dom'

const researchAnchorIds = {
  'Genomic Surveillance': 'research-genomic-surveillance',
  'Sequence Analysis': 'research-sequence-analysis',
}

export default function Research() {
  const { kicker, title, summary, areas, pipelines } = researchContent

  return (
    <section
      id="research"
      className="research editorial-section wrap"
      aria-labelledby="research-title"
    >
      <div className="section-kicker">
        <span>{kicker[0]}</span>
        <span>{kicker[1]}</span>
      </div>
      <div className="section-heading">
        <h2 id="research-title">
          {title[0]}
          <br />
          <em>{title[1]}</em>
        </h2>
        <p>
          {summary[0]}
          <br />
          {summary[1]}
        </p>
      </div>
      <div className="research-list">
        {areas.map(([title, description, detail], index) => (
          <details id={researchAnchorIds[title]} key={title} className="research-row">
            <summary>
              <span className="row-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="row-toggle" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="research-detail">{detail}</div>
          </details>
        ))}
      </div>
      <div id="bioinformatics-pipelines" className="pipelines">
        <div className="pipelines-heading-row">
          <h3>Open-source pipelines</h3>
          <p>
            Selected Nextflow and Python workflows we build and maintain, published for public
            health labs everywhere.
          </p>
        </div>
        <div className="pipeline-list">
          {pipelines.map((pipeline) => (
            <a
              key={pipeline.name}
              className="pipeline-row"
              href={pipeline.url}
              target="_blank"
              rel="noreferrer"
            >
              <h4>{pipeline.name}</h4>
              <p>{pipeline.description}</p>
              <span className="pipeline-link">
                View on GitHub <span aria-hidden="true">↗</span>
              </span>
            </a>
          ))}
        </div>
        <Link className="text-link pipelines-all" to="/pipelines">
          All BPHL-Molecular repositories <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  )
}
