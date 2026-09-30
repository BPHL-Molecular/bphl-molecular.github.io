import Icon from '../ui/Icon'
import { Link, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import banner from '../../assets/banner/bphl-mol-bioinformatics.svg'
import { primaryNavigation } from '../../data/navigation'

const links = primaryNavigation.filter(({ to }) => to !== '/#research')
function NavigationLinks({ onNavigate }) {
  return (
    <>
      {links.map(({ label, to }) => (
        <Link key={label} to={to} onClick={onNavigate}>
          {label}
        </Link>
      ))}
      <Link to="/#research" className="nav-explore" onClick={onNavigate}>
        Explore Research <Icon name="arrow-up-right" />
      </Link>
    </>
  )
}
function Logo({ onNavigate }) {
  return (
    <Link
      to="/#hero"
      className="wordmark"
      aria-label="BPHL Bioinformatics home"
      onClick={onNavigate}
    >
      <img
        src={banner}
        alt="Florida Department of Health — BPHL MOL Bioinformatics"
        width="791"
        height="288"
      />
    </Link>
  )
}
export default function Navbar() {
  const { pathname } = useLocation()
  const menuButton = useRef(null)
  const dialog = useRef(null)
  const closeButton = useRef(null)
  const [open, setOpen] = useState(false)
  const [inputMode, setInputMode] = useState('pointer')
  const [scrolled, setScrolled] = useState(false)
  const close = () => setOpen(false)

  // Safari can treat dialog autofocus as keyboard focus even after a tap.
  // Track actual input so focus stays accessible without a tap-only outline.
  useEffect(() => {
    const pointer = () => setInputMode('pointer')
    const keyboard = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const activatesMenuControl =
        (event.key === 'Enter' || event.key === ' ') &&
        (event.target === menuButton.current || dialog.current?.contains(event.target))
      // Arrow/Page/Home/End keys scroll; they do not navigate focus in this menu.
      if (event.key === 'Tab' || activatesMenuControl) setInputMode('keyboard')
    }
    document.addEventListener('pointerdown', pointer, true)
    document.addEventListener('keydown', keyboard, true)
    return () => {
      document.removeEventListener('pointerdown', pointer, true)
      document.removeEventListener('keydown', keyboard, true)
    }
  }, [])

  useEffect(() => {
    const scroll = () => {
      if (document.documentElement.dataset.menuOpen) return
      setScrolled(!document.getElementById('hero') || window.scrollY > 24)
    }
    scroll()
    window.addEventListener('scroll', scroll, { passive: true })
    return () => window.removeEventListener('scroll', scroll)
  }, [pathname])

  useLayoutEffect(() => {
    if (!open) return
    const element = dialog.current
    const trigger = menuButton.current
    const x = window.scrollX,
      y = window.scrollY
    const body = document.body
    const saved = body.getAttribute('style')
    document.documentElement.dataset.menuOpen = 'true'
    window.dispatchEvent(new Event('bphl-menu-change'))
    body.style.position = 'fixed'
    body.style.top = `${-y}px`
    body.style.left = `${-x}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    element.showModal()
    closeButton.current.focus()
    return () => {
      element.close()
      if (saved === null) body.removeAttribute('style')
      else body.setAttribute('style', saved)
      window.scrollTo({ left: x, top: y, behavior: 'instant' })
      delete document.documentElement.dataset.menuOpen
      window.dispatchEvent(new Event('bphl-menu-change'))
      trigger?.focus({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    const media = matchMedia('(min-width: 1101px)')
    const resize = () => {
      if (media.matches) setOpen(false)
    }
    media.addEventListener('change', resize)
    return () => media.removeEventListener('change', resize)
  }, [])

  const containFocus = (event) => {
    if (event.key !== 'Tab') return
    const targets = [...dialog.current.querySelectorAll('a[href], button:not(:disabled)')]
    if (!targets.length) return
    const current = targets.indexOf(document.activeElement)
    const next = event.shiftKey
      ? (current <= 0 ? targets.length : current) - 1
      : (current + 1) % targets.length
    event.preventDefault()
    targets[next].focus()
  }
  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <Logo />
        <button
          ref={menuButton}
          type="button"
          className="menu-toggle"
          data-input-mode={inputMode}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          Menu <Icon name="menu" />
        </button>
        <nav id="main-navigation" aria-label="Main navigation">
          <NavigationLinks />
        </nav>
      </header>
      {createPortal(
        <dialog
          ref={dialog}
          id="mobile-navigation"
          className="navigation-dialog"
          data-input-mode={inputMode}
          aria-label="Site menu"
          onCancel={(event) => {
            event.preventDefault()
            close()
          }}
          onKeyDown={containFocus}
        >
          <div className="navigation-dialog-header">
            <Logo onNavigate={close} />
            <button ref={closeButton} type="button" className="menu-close" onClick={close}>
              Close <Icon name="close" />
            </button>
          </div>
          <nav aria-label="Main navigation">
            <NavigationLinks onNavigate={close} />
          </nav>
        </dialog>,
        document.body,
      )}
    </>
  )
}
