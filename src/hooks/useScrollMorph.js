import { useLayoutEffect, useRef, useState } from 'react'

const clamp = (value) => Math.min(1, Math.max(0, value))
const MORPH_FRACTION = 0.4

export default function useScrollMorph(story, reducedMotion) {
  const progress = useRef({ value: 0 })
  const [active, setActive] = useState(0)
  const [inStory, setInStory] = useState(true)

  useLayoutEffect(() => {
    const sections = [...story.current.querySelectorAll('.story-section')]
    const hero = sections[0]
    let positions = []
    let frame = 0
    let disposed = false

    const update = () => {
      const y = window.scrollY
      let stage = 0

      for (let i = 0; i < positions.length; i++) {
        const { start, end } = positions[i]
        if (y < start) break
        stage = i + clamp((y - start) / Math.max(1, (end - start) * MORPH_FRACTION))
      }

      progress.current.value = (reducedMotion ? Math.round(stage) : stage) / sections.length
      setActive(Math.min(sections.length - 1, Math.floor(stage)))
      setInStory(y < positions.at(-1).end)
      hero.dataset.morphProgress = String(clamp(stage))
      hero.dataset.pinned = 'false'
    }

    const measure = () => {
      positions = sections.map((section) => {
        const rect = section.getBoundingClientRect()
        return { start: rect.top + window.scrollY, end: rect.bottom + window.scrollY }
      })
      update()
    }

    const scheduleUpdate = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }

    const scheduleMeasure = () => {
      if (disposed) return
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = 0
        measure()
      })
    }

    const observer = new ResizeObserver(scheduleMeasure)
    sections.forEach((section) => observer.observe(section))
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleMeasure)
    measure()
    document.fonts.ready.then(scheduleMeasure)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleMeasure)
    }
  }, [story, reducedMotion])

  return { progress, active, inStory }
}
