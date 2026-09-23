import { lazy, Suspense, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import StorySections from '../components/sections/StorySections'
import About from '../components/sections/About'
import Research from '../components/sections/Research'
import Training from '../components/sections/Training'
import Team from '../components/sections/Team'
import Contact from '../components/sections/Contact'
import SectionProgress from '../components/layout/SectionProgress'
import useReducedMotion from '../hooks/useReducedMotion'
import useScrollMorph from '../hooks/useScrollMorph'
const BioScene = lazy(() => import('../components/three/BioScene'))
export default function Home() {
  const story = useRef(null)
  const location = useLocation()
  const reducedMotion = useReducedMotion()
  const { progress, active, inStory } = useScrollMorph(story, reducedMotion)
  const isReturningToTeam = Number.isFinite(location.state?.restoreHomeScrollY)

  return (
    <div className={`home ${isReturningToTeam ? 'is-returning-to-team' : ''}`}>
      <div className="story" ref={story}>
        <div className="scene-shell" aria-hidden="true">
          <div className="scene-region">
            <Suspense fallback={<div className="scene-loading">Preparing the molecular view</div>}>
              <BioScene progress={progress} reducedMotion={reducedMotion} />
            </Suspense>
          </div>
          <div className="scene-coordinate">
            BPHL / GENOMIC EXPLORATIONS<span>FL — 27.6648° N, 81.5158° W</span>
          </div>
        </div>
        <StorySections />
        <SectionProgress active={active} visible={inStory} />
      </div>
      <About />
      <Research />
      <Training />
      <Team />
      <Contact />
    </div>
  )
}
