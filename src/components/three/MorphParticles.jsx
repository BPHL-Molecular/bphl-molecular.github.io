import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import createSequenceLabels from './SequenceLabels'
import {
  BufferAttribute,
  BufferGeometry,
  ShaderMaterial,
  MathUtils,
  LineBasicMaterial,
} from 'three'
import generateDNA from '../../lib/generateDNA'
import generateBlob from '../../lib/generateBlob'
import generateSequencing from '../../lib/generateSequencing'
import generateNetwork from '../../lib/generateNetwork'
import loadPointCloud from '../../lib/loadPointCloud'
import { pathogenAsset, SVG_ASSETS } from '../../config/assets'
import { VISUAL_CONFIG } from '../../config/visual'

const vertexShader = `
attribute vec3 aBlob;
attribute vec3 aLoadedPathogen;
attribute vec3 aSequence;
attribute vec3 aNetwork;
attribute vec3 aFlorida;
attribute float aSeed;
uniform float uStage;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uFloridaReady;
varying float vDepth;
varying float vSeed;
varying float vBody;
varying float vPathogen;
varying float vSequence;
varying vec3 vSurface;
void main() {
  float local = fract(uStage);
  // Steady travel with soft edges; avoid compressing movement into the middle.
  float blend = mix(local, smoothstep(0.0,1.0,local), .35);
  vec3 pathogen = aLoadedPathogen;
  vec3 florida = mix(aBlob, aFlorida, uFloridaReady);
  vec3 p;
  if (uStage < 1.0) p = mix(aBlob, position, blend);
  else if (uStage < 2.0) p = mix(position, pathogen, blend);
  else if (uStage < 3.0) p = mix(pathogen, aSequence, blend);
  else if (uStage < 4.0) p = mix(aSequence, aNetwork, blend);
  else p = mix(aNetwork, florida, smoothstep(0.0, 1.0, clamp(uStage - 4.0, 0.0, 1.0)));
  float loosen = pow(sin(local * 3.14159265),2.0) * .12;
  p += vec3(sin(aSeed*43.0+uTime*.18), cos(aSeed*35.0), sin(aSeed*29.0)) * loosen;
  vSequence = 1.0 - smoothstep(0.0,.6,abs(uStage-3.0));
  float motion = (1.0-vSequence) * smoothstep(0.0,.25,uStage) * (1.0 - smoothstep(4.0,5.0,uStage)) * .016;
  p.x += sin(uTime*.5+p.y*2.0+aSeed*3.0)*motion;
  vec4 view = modelViewMatrix * vec4(p,1.0);
  gl_Position = projectionMatrix * view;
  // Build a fuller surface through the blob and pathogen stages.
  vBody = 1.0 - smoothstep(0.0, 1.0, uStage);
  vPathogen = 1.0 - smoothstep(0.0,.65,abs(uStage-2.0));
  vSurface = p;
  float thickness = mix(1.0, 2.7, vBody) + vPathogen * 1.25 + vSequence * 1.65;
  gl_PointSize = clamp(uSize * thickness * 1100.0 * uPixelRatio * (.6+aSeed*.7) / -view.z, 1.0, 10.0);
  vDepth = clamp((view.z + 12.0) / 5.0,0.0,1.0);
  vSeed = aSeed;
}`
const fragmentShader = `
uniform float uOpacity;
varying vec3 vSurface;
varying float vDepth;
varying float vSeed;
varying float vBody;
varying float vPathogen;
varying float vSequence;
void main() {
  float r = length(gl_PointCoord-.5);
  if(r > .5) discard;
  float opacity = mix(.38+vDepth*.4, .68+vDepth*.28, max(vBody,vPathogen));
  float alpha = (1.0-smoothstep(mix(.25,.34,vBody),.5,r)) * opacity;
  vec3 farColor = mix(vec3(.52,.64,.61), vec3(.30,.49,.44), vBody);
  vec3 nearColor = mix(vec3(.17,.37,.34), vec3(.10,.29,.25), vBody);
  vec3 color = mix(farColor,nearColor,vDepth);
  color = mix(color,vec3(.48,.69,.69),step(.92,vSeed)*.55);
  vec2 uv = (gl_PointCoord - .5) * 2.0;
  float sphere = sqrt(max(0.0, 1.0-dot(uv,uv)));
  float light = .78 + .22 * sphere - uv.x * .10 + uv.y * .10;
  // Teal gathers at opposing edges; the sphere stays predominantly soft cream.
  vec3 normal = normalize(vSurface);
  float edge = smoothstep(.32,.90,abs(normal.x));
  float diagonal = smoothstep(.05,.65,normal.x * normal.y * 3.0);
  float tealPatch = edge * diagonal;
  float surfaceLight = .88 + .12 * max(0.0,dot(normal,normalize(vec3(-.6,.8,1.5))));
  vec3 cream = vec3(.96,.945,.90);
  vec3 teal = vec3(.30,.52,.49);
  vec3 body = mix(cream, teal, tealPatch * .86);
  float glow = exp(-pow(vSurface.x-.35,2.0)*1.4-pow(vSurface.y-.1,2.0)*.75);
  body = mix(body,vec3(1.0,.72,.43),glow*.46) * light * surfaceLight;
  color = mix(color, body, vBody);
  alpha = mix(alpha, 1.0-smoothstep(.40,.5,r), vBody);
  float cell = floor(vSurface.x/.31+8.0);
  float creamWeight = .35 + .32*sin(cell*2.1+floor(vSurface.y/.43)*1.7);
  vec3 readColor = mix(vec3(.29,.49,.46),cream,creamWeight);
  float variant = 1.0-smoothstep(.085,.17,abs(vSurface.x-1.085));
  readColor = mix(readColor,vec3(.96,.64,.26),variant*.9);
  color = mix(color,readColor*light,vSequence);
  alpha = mix(alpha,1.0-smoothstep(.38,.5,r),vSequence);
  if(alpha < .15) discard;
  gl_FragColor = vec4(color,alpha * uOpacity);
}`

function stageAt(progress) {
  const stops = VISUAL_CONFIG.morphStops
  for (let i = 0; i < stops.length - 1; i++)
    if (progress <= stops[i + 1])
      return i + Math.max(0, (progress - stops[i]) / (stops[i + 1] - stops[i]))
  return 5
}
export default function MorphParticles({
  count,
  progress,
  reducedMotion,
  interaction,
  onReadableChange,
}) {
  const group = useRef(null),
    labels = useRef(null),
    cloud = useRef(null),
    lines = useRef(null)
  const rotationPhase = useRef(0)
  const loaded = useRef({ bacterium: false, florida: false })
  const scene = useMemo(() => {
    const geometry = new BufferGeometry()
    const sequenceLabels = createSequenceLabels()
    const network = generateNetwork(count)
    const blob = generateBlob(count)
    geometry.setAttribute('position', new BufferAttribute(generateDNA(count), 3))
    geometry.setAttribute('aBlob', new BufferAttribute(blob, 3))
    geometry.setAttribute('aLoadedPathogen', new BufferAttribute(new Float32Array(count * 3), 3))
    geometry.setAttribute('aSequence', new BufferAttribute(generateSequencing(count), 3))
    geometry.setAttribute('aNetwork', new BufferAttribute(network.points, 3))
    geometry.setAttribute('aFlorida', new BufferAttribute(blob.slice(), 3))
    geometry.setAttribute(
      'aSeed',
      new BufferAttribute(
        Float32Array.from({ length: count }, (_, i) => ((i * 7919) % count) / count),
        1,
      ),
    )
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: true,
      uniforms: {
        uStage: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: VISUAL_CONFIG.pointSize },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 1 },
        uFloridaReady: { value: 0 },
      },
    })
    const lineGeometry = new BufferGeometry().setAttribute(
      'position',
      new BufferAttribute(network.lines, 3),
    )
    const lineMaterial = new LineBasicMaterial({
      color: '#779e94',
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    return { geometry, material, lineGeometry, lineMaterial, sequenceLabels }
  }, [count])
  useEffect(() => {
    let cancelled = false
    loaded.current = { bacterium: false, florida: false }
    const update = (attribute, points, type) => {
      if (cancelled) return
      scene.geometry.setAttribute(attribute, new BufferAttribute(points, 3))
      loaded.current[type] = true
    }
    loadPointCloud('svg', SVG_ASSETS.florida, count)
      .then((points) => {
        update('aFlorida', points, 'florida')
      })
      .catch((error) => {
        if (!cancelled) console.warn('BPHL: Florida asset fallback:', error.message)
      })
    loadPointCloud('points', pathogenAsset(count), count)
      .then((points) => {
        update('aLoadedPathogen', points, 'bacterium')
      })
      .catch((error) => {
        if (!cancelled) console.warn('BPHL: Pathogen points unavailable:', error.message)
      })
    return () => {
      cancelled = true
      scene.geometry.dispose()
      scene.material.dispose()
      scene.lineGeometry.dispose()
      scene.lineMaterial.dispose()
      scene.sequenceLabels.texture.dispose()
    }
  }, [scene, count])
  useFrame((state, delta) => {
    // The scroll controller supplies discrete complete forms for reduced motion.
    const stage = stageAt(progress.current.value)
    state.gl.domElement.dataset.morphStage = String(stage)
    const time = reducedMotion ? 0 : state.clock.elapsedTime
    cloud.current.material.uniforms.uStage.value = stage
    cloud.current.material.uniforms.uTime.value = time
    cloud.current.material.uniforms.uPixelRatio.value = state.gl.getPixelRatio()
    const networkWeight = Math.max(0, 1 - Math.abs(stage - 4) * 2)
    lines.current.material.opacity = networkWeight * (0.22 + Math.sin(time * 0.5) * 0.03)
    if (labels.current)
      labels.current.opacity = MathUtils.smoothstep(1 - Math.abs(stage - 3), 0.8, 1)
    const dt = Math.min(delta, 0.05)
    const uniforms = cloud.current.material.uniforms
    // Never draw an invented shape while the saved pathogen points are pending.
    const waitingForPathogen = stage > 1 && stage < 3 && !loaded.current.bacterium
    cloud.current.visible = !waitingForPathogen
    uniforms.uOpacity.value = waitingForPathogen
      ? 0
      : reducedMotion
        ? 1
        : MathUtils.damp(uniforms.uOpacity.value, 1, 8, dt)
    state.gl.domElement.dataset.pathogenReady = String(loaded.current.bacterium)
    state.gl.domElement.dataset.particlesVisible = String(cloud.current.visible)
    for (const [name, ready] of [['uFloridaReady', loaded.current.florida]]) {
      uniforms[name].value = reducedMotion
        ? Number(ready)
        : MathUtils.damp(uniforms[name].value, Number(ready), 5, dt)
    }
    // Turn the organic forms continuously. Ease to a readable angle for reads and map.
    // Ramp starts as soon as the previous shape is complete (not partway into the morph)
    // so the free-spin has the whole incoming transition to bleed off before the reads
    // form, rather than fighting a large backlog of spin in the final stretch.
    const sequenceFacing =
      stage <= 3 ? MathUtils.smoothstep(stage, 2, 3) : 1 - MathUtils.smoothstep(stage, 3, 4)
    const mapFacing = MathUtils.smoothstep(stage, 4, 5)
    const readable = Math.max(sequenceFacing, mapFacing)
    // BioScene owns the interaction ref; it applies the drag clamp so this component
    // (which only receives that ref as a prop) doesn't mutate it directly.
    onReadableChange(readable)
    if (!reducedMotion) {
      // Stop free-spinning as soon as a readable facing is requested (sequence/map stages).
      // The correction below is bounded to +-PI (180deg) via atan2, so cutting the
      // continuous auto-rotate here keeps the total turn into those views under 180deg
      // instead of letting leftover spin momentum add on top of the snap-back.
      rotationPhase.current += dt * VISUAL_CONFIG.autoRotateSpeed * (readable > 0 ? 0 : 1)
      const facing = Math.sin(time * 0.2) * 0.12 - rotationPhase.current
      const nearestFacing = Math.atan2(Math.sin(facing), Math.cos(facing))
      rotationPhase.current += nearestFacing * (1 - Math.exp(-3 * dt * readable))
    }
    const turn = rotationPhase.current
    const rotateY = reducedMotion ? 0 : turn + interaction.current.drag
    const difference = Math.atan2(
      Math.sin(rotateY - group.current.rotation.y),
      Math.cos(rotateY - group.current.rotation.y),
    )
    group.current.rotation.y = reducedMotion
      ? 0
      : group.current.rotation.y + difference * (1 - Math.exp(-4 * dt))
    // Automatic tilt only; user dragging affects the horizontal rotation above.
    const tilt = Math.sin(time * 0.17) * 0.035 * (1 - readable)
    group.current.rotation.x = reducedMotion
      ? 0
      : MathUtils.damp(group.current.rotation.x, tilt, 8, dt)
    state.gl.domElement.dataset.rotationX = String(group.current.rotation.x)
    group.current.rotation.z = reducedMotion ? 0 : Math.sin(time * 0.1) * 0.012 * (1 - readable)
    state.gl.domElement.dataset.rotationY = String(group.current.rotation.y)
  })
  return (
    <group ref={group}>
      <points
        ref={cloud}
        geometry={scene.geometry}
        material={scene.material}
        frustumCulled={false}
      />
      <lineSegments ref={lines} geometry={scene.lineGeometry} material={scene.lineMaterial} />
      <mesh position={[0, 0, 0.24]} renderOrder={2}>
        <planeGeometry args={[scene.sequenceLabels.width, scene.sequenceLabels.height]} />
        <meshBasicMaterial
          ref={labels}
          map={scene.sequenceLabels.texture}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
