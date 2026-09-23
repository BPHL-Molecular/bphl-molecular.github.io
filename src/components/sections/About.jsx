const aboutContent = {
  kicker: ['01 / ABOUT US', 'BUILT FOR PUBLIC HEALTH'],

  title: ['Working with genomic data.', 'Supporting public health.'],

  lead: 'BPHL Bioinformatics develops and supports tools for analyzing genomic data in Florida’s public health laboratories.',

  copy: 'Our work includes pipeline development, genomic surveillance, sequence data analysis, and training. We work with laboratorians and epidemiologists to make complex results easier to understand and use.',

  link: 'Learn more about our work',

  principles: [
    ['Analyze the data.', 'Turn sequencing data into clear, consistent results.'],
    [
      'Build for the laboratory.',
      'Develop workflows around the needs of public health laboratories.',
    ],
    ['Share what we learn.', 'Provide training, documentation, and technical support.'],
  ],
}

export default function About() {
  const { kicker, title, lead, copy, link, principles } = aboutContent

  return (
    <section id="about" className="about editorial-section wrap" aria-labelledby="about-title">
      <div className="section-kicker">
        <span>{kicker[0]}</span>
        <span>{kicker[1]}</span>
      </div>

      <div className="editorial-grid">
        <h2 id="about-title">
          {title[0]}
          <br />
          <em>{title[1]}</em>
        </h2>

        <div className="section-body">
          <p className="lead">{lead}</p>
          <p>{copy}</p>

          <a href="#research" className="text-link">
            {link} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <div className="principles">
        {principles.map(([heading, description], index) => (
          <div key={heading}>
            <span>0{index + 1}</span>
            <h3>{heading}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
