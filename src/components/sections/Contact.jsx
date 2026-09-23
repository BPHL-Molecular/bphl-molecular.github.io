export default function Contact() {
  return (
    <section
      id="contact"
      className="contact editorial-section wrap"
      aria-labelledby="contact-title"
    >
      <div className="section-kicker">
        <span>05 / CONTACT</span>
        <span>QUESTIONS? START HERE.</span>
      </div>

      <div className="editorial-grid">
        <h2 id="contact-title">
          Have a question?
          <br />
          <em>Get in touch.</em>
        </h2>

        <div className="section-body">
          <p className="lead">
            Florida Department of Health
            <br />
            Bureau of Public Health Laboratories
            <br />
            Bioinformatics Team
          </p>

          <p>
            Contact the BPHL Bioinformatics team with questions about our tools, training, or
            technical resources.
          </p>

          <dl className="contact-details">
            <div>
              <dt>Email</dt>
              <dd>
                <a href="mailto:bphl-sebioinformatics@flhealth.gov">
                  bphl-sebioinformatics@flhealth.gov
                </a>
              </dd>
            </div>

            <div>
              <dt>Location</dt>
              <dd>Florida, United States</dd>
            </div>

            <div>
              <dt>General inquiries</dt>
              <dd>Bioinformatics tools, training, technical support, and collaboration</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="site-notices">
        <details id="accessibility">
          <summary>Accessibility</summary>
          <p>
            This site supports keyboard navigation and reduced motion. The scientific visuals are
            decorative, and all information is also available as text.
          </p>
        </details>

        <details id="privacy">
          <summary>Privacy</summary>
          <p>
            This site does not use contact forms or analytics. Fonts and visual assets are served
            locally.
          </p>
        </details>
      </div>
    </section>
  )
}
