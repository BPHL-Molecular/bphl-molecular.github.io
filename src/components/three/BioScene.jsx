import { Component, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import MorphParticles from './MorphParticles'
import { SVG_ASSETS } from '../../config/assets'
import { VISUAL_CONFIG } from '../../config/visual'

const MAX_READABLE_DRAG = (VISUAL_CONFIG.maxReadableDragDeg * Math.PI) / 180

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.warn('BPHL: WebGL unavailable. Using the static scientific visual.', error.message)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    const available = !!context
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return available
  } catch {
    return false
  }
}
export default function BioScene({ progress, reducedMotion }) {
  const [webgl] = useState(supportsWebGL)
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 700px)').matches)
  const [visible, setVisible] = useState(true)
  const container = useRef(null)
  const interaction = useRef({ drag: 0, dragging: false, lastX: 0, readable: 0 })
  // Owns the interaction ref's writes so MorphParticles (which only receives it as a
  // prop) can report the current readable-facing weight without mutating a prop itself.
  const setReadable = (value) => {
    interaction.current.readable = value
    if (value > 0)
      interaction.current.drag = Math.min(
        MAX_READABLE_DRAG,
        Math.max(-MAX_READABLE_DRAG, interaction.current.drag),
      )
    if (container.current) {
      const value = String(interaction.current.drag)
      if (container.current.dataset.dragRotation !== value)
        container.current.dataset.dragRotation = value
    }
  }
  useEffect(() => {
    const media = matchMedia('(max-width: 700px)')
    const change = () => setCompact(media.matches)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(container.current)
    media.addEventListener('change', change)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', change)
    }
  }, [])
  const fallback = (
    <div className="scene-fallback">
      {SVG_ASSETS.florida && <img src={SVG_ASSETS.florida} alt="" />}
    </div>
  )
  return (
    <div
      ref={container}
      className="scene-interaction"
      style={{ width: '100%', height: '100%' }}
      onPointerMove={(event) => {
        if (reducedMotion || event.pointerType !== 'mouse' || !interaction.current.dragging) return
        // Horizontal press-and-drag only; hover and vertical movement are ignored.
        interaction.current.drag += (event.clientX - interaction.current.lastX) * 0.006
        // Reads/map: clamp per-move so a fast drag can't outrun the once-per-frame clamp
        // in MorphParticles and momentarily spin past the cap before it catches up.
        if (interaction.current.readable > 0)
          interaction.current.drag = Math.min(
            MAX_READABLE_DRAG,
            Math.max(-MAX_READABLE_DRAG, interaction.current.drag),
          )
        interaction.current.lastX = event.clientX
        event.currentTarget.dataset.dragRotation = String(interaction.current.drag)
        event.currentTarget.dataset.dragTilt = '0'
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || reducedMotion) return
        event.currentTarget.dataset.dragging = 'true'
        interaction.current.dragging = true
        interaction.current.lastX = event.clientX
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerUp={(event) => {
        interaction.current.dragging = false
        event.currentTarget.dataset.dragging = 'false'
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={(event) => {
        interaction.current.dragging = false
        event.currentTarget.dataset.dragging = 'false'
      }}
      onLostPointerCapture={(event) => {
        interaction.current.dragging = false
        event.currentTarget.dataset.dragging = 'false'
      }}
    >
      {webgl ? (
        <SceneBoundary fallback={fallback}>
          <Canvas
            dpr={[1, compact ? 1.3 : VISUAL_CONFIG.maxPixelRatio]}
            camera={{ position: [0, 0, 10], fov: 42, near: 0.1, far: 50 }}
            gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
            frameloop={visible ? 'always' : 'never'}
            fallback={fallback}
            onCreated={({ gl }) => gl.setClearColor('#f2f4f3', 0)}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 5, 4]} intensity={1} />
            <Suspense fallback={null}>
              <MorphParticles
                count={
                  compact || reducedMotion
                    ? VISUAL_CONFIG.reducedParticleCount
                    : VISUAL_CONFIG.particleCount
                }
                progress={progress}
                reducedMotion={reducedMotion}
                interaction={interaction}
                onReadableChange={setReadable}
              />
            </Suspense>
          </Canvas>
        </SceneBoundary>
      ) : (
        fallback
      )}
    </div>
  )
}
