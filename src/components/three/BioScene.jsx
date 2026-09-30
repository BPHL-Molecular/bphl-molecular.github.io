import { Component, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import MorphParticles from './MorphParticles'
import SceneQuality from './SceneQuality'
import { QUALITY_LEVELS } from '../../lib/adaptiveQuality'
import sphereFallback from '../../assets/fallbacks/sphere.svg'
import pathogenFallback from '../../assets/fallbacks/pathogen.svg'
import sequenceFallback from '../../assets/fallbacks/sequence.svg'
import networkFallback from '../../assets/fallbacks/network.svg'
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
function graphicsSupport() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    if (!context) return { available: false, software: false }
    const rendererInfo = context.getExtension('WEBGL_debug_renderer_info')
    const renderer = rendererInfo
      ? context.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL)
      : context.getParameter(context.RENDERER)
    const software = /swiftshader|llvmpipe|software|basic render|citrix/i.test(String(renderer))
    const maxBuffer = context.getParameter(context.MAX_RENDERBUFFER_SIZE)
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return { available: true, software, maxBuffer }
  } catch {
    return { available: false, software: false }
  }
}
export default function BioScene({
  progress,
  reducedMotion,
  lightweight = false,
  active = true,
  chapter = 0,
}) {
  const [graphics] = useState(graphicsSupport)
  const [quality, setQuality] = useState(() => (graphics.software || lightweight ? 0 : 1))
  const [contextLost, setContextLost] = useState(false)
  const [assetStatus, setAssetStatus] = useState('')
  const cleanupContext = useRef(null)
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
  useEffect(() => () => cleanupContext.current?.(), [])
  const fallback = (
    <div className="scene-fallback" data-chapter={chapter}>
      <img
        src={
          [sphereFallback, pathogenFallback, sequenceFallback, networkFallback, SVG_ASSETS.florida][
            chapter
          ]
        }
        alt=""
      />
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
      {graphics.available ? (
        <SceneBoundary fallback={fallback}>
          <Canvas
            dpr={1}
            camera={{ position: [0, 0, 10], fov: 42, near: 0.1, far: 50 }}
            gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
            frameloop={!active || contextLost ? 'never' : reducedMotion ? 'demand' : 'always'}
            fallback={fallback}
            onCreated={({ gl, invalidate }) => {
              gl.setClearColor('#f2f4f3', 0)
              const lost = (event) => {
                event.preventDefault()
                setContextLost(true)
              }
              const restored = () => {
                setContextLost(false)
                invalidate()
              }
              gl.domElement.addEventListener('webglcontextlost', lost)
              gl.domElement.addEventListener('webglcontextrestored', restored)
              cleanupContext.current = () => {
                gl.domElement.removeEventListener('webglcontextlost', lost)
                gl.domElement.removeEventListener('webglcontextrestored', restored)
              }
            }}
          >
            <SceneQuality
              level={quality}
              onChange={setQuality}
              progress={progress}
              active={active && !contextLost}
              reducedMotion={reducedMotion}
              software={graphics.software}
              maxBuffer={graphics.maxBuffer}
            />
            <ambientLight intensity={0.7} />
            <directionalLight position={[3, 5, 4]} intensity={1} />
            <Suspense fallback={null}>
              <MorphParticles
                active={active && !contextLost}
                count={QUALITY_LEVELS[quality].count}
                onAssetStatus={setAssetStatus}
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
      {contextLost && (
        <div className="scene-status-overlay">
          {fallback}
          <span>Graphics paused. Restoring the scientific view…</span>
        </div>
      )}
      {!contextLost && assetStatus && (
        <div className="scene-status-overlay">
          <img
            src={assetStatus.includes('pathogen') ? pathogenFallback : SVG_ASSETS.florida}
            alt=""
          />
          <span>{assetStatus}</span>
        </div>
      )}
    </div>
  )
}
