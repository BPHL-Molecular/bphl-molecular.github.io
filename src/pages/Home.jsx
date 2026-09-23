import { lazy, Suspense, useRef, useState } from 'react'
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
const motionKey = 'bphl-scene-motion'

function savedMotionPreference() {
  try {
    const saved = sessionStorage.getItem(motionKey)
    return saved === 'play' || saved === 'pause' ? saved : null
  } catch {
    return null
  }
}

export default function Home() {
  const story = useRef(null)
  const location = useLocation()
  const systemReducedMotion = useReducedMotion()
  const [motionPreference, setMotionPreference] = useState(savedMotionPreference)
  const reducedMotion = motionPreference ? motionPreference === 'pause' : systemReducedMotion
  const { progress, active, inStory } = useScrollMorph(story, reducedMotion)
  const isReturningToTeam = Number.isFinite(location.state?.restoreHomeScrollY)

  const toggleMotion = () => {
    const next = reducedMotion ? 'play' : 'pause'
    setMotionPreference(next)
    try {
      sessionStorage.setItem(motionKey, next)
    } catch {
      // The control still works when browser storage is unavailable.
    }
  }

  return (
    <div className={`home ${isReturningToTeam ? 'is-returning-to-team' : ''}`}>
      <div className="story" ref={story}>
        <div className={`scene-shell ${inStory ? 'is-visible' : ''}`} aria-hidden="true">
          <div className="scene-region">
            <Suspense fallback={<div className="scene-loading">Preparing the molecular view</div>}>
              <BioScene
                progress={progress}
                reducedMotion={reducedMotion}
                lightweight={systemReducedMotion}
              />
            </Suspense>
          </div>
          <div className="scene-coordinate">
            BPHL / GENOMIC EXPLORATIONS<span>FL — 27.6648° N, 81.5158° W</span>
          </div>
        </div>
        <StorySections
          reducedMotion={reducedMotion}
          systemMotionPaused={systemReducedMotion && !motionPreference}
          onToggleMotion={toggleMotion}
        />
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
