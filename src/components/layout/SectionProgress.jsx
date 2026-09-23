const sections = ['hero', 'pathogens', 'sequencing', 'network', 'florida']
export default function SectionProgress({ active, visible }) {
  return (
    <nav
      className={`section-progress ${visible ? '' : 'is-hidden'}`}
      aria-label="Visual story chapters"
      inert={!visible}
    >
      <span className="progress-track">
        <span style={{ transform: `translateY(${active * 48}px)` }} />
      </span>
      {sections.map((id, index) => (
        <a
          key={id}
          href={`#${id}`}
          className={active === index ? 'active' : ''}
          aria-current={active === index ? 'step' : undefined}
          aria-label={`Chapter ${index + 1}: ${id}`}
        >
          0{index + 1}
        </a>
      ))}
    </nav>
  )
}
