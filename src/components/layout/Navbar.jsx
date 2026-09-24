import { Link, useLocation } from 'react-router-dom'
import banner from '../../assets/banner/bphl-mol-bioinformatics.svg'
import { primaryNavigation } from '../../data/navigation'
import { useEffect, useRef, useState } from 'react'
export default function Navbar() {
  const { pathname } = useLocation()
  const menuButton = useRef(null)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const scroll = () => {
      const hero = document.getElementById('hero')
      setScrolled(!hero || window.scrollY > 24)
    }

    scroll()
    window.addEventListener('scroll', scroll, { passive: true })
    return () => window.removeEventListener('scroll', scroll)
  }, [pathname])

  useEffect(() => {
    const escape = (event) => {
      if (event.key === 'Escape' && open) {
        setOpen(false)
        menuButton.current?.focus()
      }
    }

    window.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('keydown', escape)
    }
  }, [open])
  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <Link
        to="/#hero"
        className="wordmark"
        aria-label="BPHL Bioinformatics home"
        onClick={() => setOpen(false)}
      >
        <img
          src={banner}
          alt="Florida Department of Health — BPHL MOL Bioinformatics"
          width="791"
          height="288"
        />
      </Link>
      <button
        ref={menuButton}
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Close −' : 'Menu +'}
      </button>
      <nav id="main-navigation" className={open ? 'is-open' : ''} aria-label="Main navigation">
        {primaryNavigation.map(({ label, to }) => (
          <Link key={label} to={to} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
        <Link to="/#research" className="nav-explore" onClick={() => setOpen(false)}>
          Explore Research <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </header>
  )
}
