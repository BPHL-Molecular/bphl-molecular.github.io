import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { VISUAL_CONFIG } from '../config/visual'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
const clamp = (value) => Math.min(1, Math.max(0, value))
export default function useScrollMorph(story, reducedMotion) {
  const progress = useRef({ value: 0 })
  const [active, setActive] = useState(0)
  const [inStory, setInStory] = useState(true)
  useLayoutEffect(() => {
    const root = story.current
    const sections = [...root.querySelectorAll('.story-section')]
    const hero = sections[0]
    let disposed = false
    let refreshFrame
    const context = gsap.context(() => {
      // Each chapter finishes its incoming morph while pinned, then holds briefly.
      const pins = sections.map((section, index) =>
        ScrollTrigger.create({
          id: index === 0 ? 'hero-morph' : 'chapter-' + section.id,
          trigger: section,
          start: 'top top',
          end: () =>
            '+=' +
            (reducedMotion
              ? 1
              : Math.round(
                  innerHeight *
                    (index === 0 ? VISUAL_CONFIG.heroScroll : VISUAL_CONFIG.chapterScroll),
                )),
          pin: !reducedMotion,
          pinSpacing: !reducedMotion,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            section.dataset.holdStart = String(self.start)
            section.dataset.holdEnd = String(self.end)
          },
        }),
      )
      const update = (self) => {
        const y = self.scroll()
        const heroPin = pins[0]
        const first = clamp(
          (y - heroPin.start) /
            Math.max(1, (heroPin.end - heroPin.start) * VISUAL_CONFIG.heroMorphFraction),
        )
        let stage = reducedMotion ? 0 : first
        let chapter = 0
        for (let i = 1; i < pins.length; i++) {
          const previous = pins[i - 1]
          const current = pins[i]
          // Spread the incoming morph across the section approach AND most of its pin.
          const completeAt =
            current.start + innerHeight * (reducedMotion ? -0.25 : VISUAL_CONFIG.chapterMorphScroll)
          if (reducedMotion) {
            if (y >= completeAt) {
              stage = i + 1
              chapter = i
            }
          } else if (y >= previous.end) {
            stage = i + clamp((y - previous.end) / Math.max(1, completeAt - previous.end))
            if (y >= current.start - innerHeight * 0.5) chapter = i
          }
        }
        progress.current.value = stage / 5
        setActive(chapter)
        setInStory(y < self.end + 50)
        hero.dataset.morphProgress = String(first)
        hero.dataset.pinned = String(!reducedMotion && y < heroPin.end)
      }
      const timeline = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onUpdate: update,
        onRefresh: update,
        onLeave: () => setInStory(false),
        onEnterBack: () => setInStory(true),
      })
      update(timeline)
      document.fonts.ready.then(() => {
        if (!disposed) {
          refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh())
        }
      })
    }, root)
    return () => {
      disposed = true
      cancelAnimationFrame(refreshFrame)
      context.revert()
    }
  }, [story, reducedMotion])
  return { progress, active, inStory }
}
