import { Link } from 'react-router-dom'
import { footerNavigation } from '../../data/navigation'
export default function Footer() {
  return (
    <footer className="footer wrap">
      <Link to="/#hero" className="wordmark">
        <span>Florida Department of Health</span>
        <strong>BPHL Bioinformatics</strong>
      </Link>
      <nav aria-label="Footer navigation">
        {footerNavigation.map(({ label, to }) => (
          <Link key={label} to={to}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="footer-bottom">
        <span>Science in service of public health.</span>
        <Link to="/#hero">Back to top ↑</Link>
      </div>
    </footer>
  )
}
