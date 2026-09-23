import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const titles = {
  '/': 'BPHL Bioinformatics | Florida Department of Health',
  '/team': 'Our Team | BPHL Bioinformatics',
  '/training': 'Training | BPHL Bioinformatics',
  '/pipelines': 'Pipelines | BPHL Bioinformatics',
}

export default function RouteNavigation() {
  const { pathname, hash, key, state } = useLocation()

  const previousKey = useRef(key)
  useEffect(() => {
    const navigated = previousKey.current !== key
    previousKey.current = key
    const route = pathname.replace(/\/+$/, '') || '/'
    document.title = titles[route] || 'Page not found | BPHL Bioinformatics'
    let cancelled = false
    let frame

    // Font metrics and the homepage pins must settle before measuring deep links.
    document.fonts.ready.then(() => {
      if (cancelled) return
      frame = requestAnimationFrame(() => {
        let id = hash.slice(1)
        try {
          id = decodeURIComponent(id)
        } catch {
          /* Keep malformed fragments harmless. */
        }
        const target = id ? document.getElementById(id) : document.getElementById('main')
        if (!target) return
        if (target instanceof HTMLDetailsElement) target.open = true
        const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
        const savedHomeScroll =
          pathname === '/' && Number.isFinite(state?.restoreHomeScrollY)
            ? state.restoreHomeScrollY
            : null
        const top =
          savedHomeScroll ??
          (hash ? target.getBoundingClientRect().top + window.scrollY - offset : 0)
        window.scrollTo({
          top: Math.max(0, top),
          // Returning from the full Team page should not replay the whole pinned story.
          behavior: 'instant',
        })
        if (!navigated && !hash) return
        const focusTarget =
          savedHomeScroll === null ? target.querySelector('summary, h1, h2') || target : target
        if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1')
        focusTarget.focus({ preventScroll: true })
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [pathname, hash, key, state])

  return null
}
