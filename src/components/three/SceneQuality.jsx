import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { createQualitySampler, pixelRatioFor } from '../../lib/adaptiveQuality'

export default function SceneQuality({
  level,
  onChange,
  progress,
  active,
  reducedMotion,
  software,
  maxBuffer,
}) {
  const sampler = useRef(createQualitySampler(level))
  const previousProgress = useRef(0)
  const lastMovement = useRef(0)
  const { size, setDpr, gl, invalidate, camera } = useThree()
  useEffect(() => {
    setDpr(pixelRatioFor(level, size.width, size.height, window.devicePixelRatio || 1, maxBuffer))
    gl.domElement.setAttribute('data-quality', String(level))
    camera.position.set(
      0,
      0,
      matchMedia('(max-width: 1100px)').matches
        ? 8.8 / Math.min(1, size.width / Math.max(1, size.height))
        : 10,
    )
    camera.updateProjectionMatrix()
  }, [level, size.width, size.height, setDpr, gl, maxBuffer, camera])
  useEffect(() => {
    sampler.current.reset()
    gl.domElement.setAttribute(
      'data-rendering',
      active ? (reducedMotion ? 'on-demand' : 'active') : 'suspended',
    )
    if (active) invalidate()
    const update = () => {
      if (active) invalidate()
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [active, reducedMotion, invalidate, gl])
  useFrame((_state, delta) => {
    if (!active || reducedMotion || software) return
    const now = performance.now()
    if (previousProgress.current !== progress.current.value) {
      previousProgress.current = progress.current.value
      lastMovement.current = now
    }
    const previousAverage = sampler.current.average
    const next = sampler.current.sample(delta * 1000, now, now - lastMovement.current > 900)
    // Sample telemetry changes only once per measurement window, not React state each frame.
    if (sampler.current.average !== previousAverage)
      gl.domElement.setAttribute('data-frame-ms', sampler.current.average.toFixed(2))
    if (next !== null) onChange(next)
  })
  return null
}
