import { useLayoutEffect, useRef, useState } from 'react'

const clamp = (value) => Math.min(1, Math.max(0, value))

export default function useScrollMorph(story, reducedMotion) {
  const progress = useRef({ value: 0 })
  const [active, setActive] = useState(0)
  const [inStory, setInStory] = useState(true)

  useLayoutEffect(() => {
    const sections = [...story.current.querySelectorAll('.story-section')]
    const hero = sections[0]
    let positions = []
    let transitions = []
    let frame = 0
    let disposed = false

    const update = () => {
      const y = window.scrollY
      let stage = 0

      for (let i = 0; i < transitions.length; i++) {
        const { start, end } = transitions[i]
        if (y < start) break
        stage = i + clamp((y - start) / Math.max(1, end - start))
      }

      progress.current.value = (reducedMotion ? Math.round(stage) : stage) / sections.length
      let chapter = 0
      for (let i = 1; i < positions.length; i++) {
        if (y >= positions[i].start - window.innerHeight * 0.5) chapter = i
      }
      setActive(chapter)
      setInStory(y < positions.at(-1).end)
      hero.dataset.morphProgress = String(clamp(stage))
      hero.dataset.pinned = 'false'
    }

    const measure = () => {
      positions = sections.map((section) => {
        const rect = section.getBoundingClientRect()
        return { start: rect.top + window.scrollY, end: rect.bottom + window.scrollY }
      })
      const headerOffset =
        parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const firstChapter = Math.max(positions[0].start + 1, positions[1].start - headerOffset)
      const dnaEnd = positions[0].start + (firstChapter - positions[0].start) * 0.45
      transitions = [{ start: positions[0].start, end: dnaEnd }]
      // Complete each incoming shape as its section reaches the navigation offset.
      // The hero contains both the sphere and DNA; later sections each have one shape.
      let previousEnd = dnaEnd
      for (let i = 1; i < positions.length; i++) {
        const end = positions[i].start - headerOffset
        transitions.push({ start: Math.max(previousEnd, end - window.innerHeight * 0.7), end })
        previousEnd = end
      }
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
