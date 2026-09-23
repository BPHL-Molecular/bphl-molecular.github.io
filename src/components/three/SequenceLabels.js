import { CanvasTexture, SRGBColorSpace } from 'three'
import { SEQUENCE, baseX, readY } from '../../lib/generateSequencing'
// SEQUENCING LABELS — one local texture keeps bases locked to their 3D read positions.
// No remote font, DOM overlays, or image assets are needed.
export default function createSequenceLabels() {
  const width = 6.5,
    height = 5.6,
    scale = 240
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Cannot create sequence labels without a 2D canvas context.')
  const x = (value) => (value + width / 2) * scale
  const y = (value) => (height / 2 - value) * scale
  const text = (value, px, py, size = 24, color = '#355e58', align = 'left') => {
    ctx.font = size + 'px monospace'
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = 'middle'
    ctx.fillText(value, x(px), y(py))
  }
  const variantX = baseX(SEQUENCE.variant)
  const glow = ctx.createLinearGradient(x(variantX - 0.15), 0, x(variantX + 0.15), 0)
  glow.addColorStop(0, '#e9b26700')
  glow.addColorStop(0.5, '#e9b26736')
  glow.addColorStop(1, '#e9b26700')
  ctx.fillStyle = glow
  ctx.fillRect(x(variantX - 0.15), y(2.3), 0.3 * scale, 4.3 * scale)
  text('REFERENCE', -2.7, 2.58, 24)
  text('ALIGNED READS', -2.7, 1.95, 22)
  for (let col = 0; col < SEQUENCE.reference.length; col++) {
    text(SEQUENCE.reference[col], baseX(col), 2.22, 35, '#24463f', 'center')
    ctx.strokeStyle = '#69898028'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 9])
    ctx.beginPath()
    ctx.moveTo(x(baseX(col)), y(2.06))
    ctx.lineTo(x(baseX(col)), y(-1.95))
    ctx.stroke()
  }
  // Matching bases agree with the reference; amber C bases mark one illustrative T>C locus.
  for (const row of [1, 4, 7]) {
    const [start, end] = SEQUENCE.reads[row]
    for (let col = start; col <= end; col++) {
      const variant = col === SEQUENCE.variant
      const base = variant ? 'C' : SEQUENCE.reference[col]
      ctx.fillStyle = '#f7f4e9ee'
      ctx.beginPath()
      ctx.arc(x(baseX(col)), y(readY(row)), 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = 'bold 33px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 5
      ctx.strokeStyle = '#f7f8f6cc'
      ctx.setLineDash([])
      ctx.strokeText(base, x(baseX(col)), y(readY(row)))
      text(base, baseX(col), readY(row), 27, variant ? '#945411' : '#163d36', 'center')
    }
  }
  text('ILLUSTRATIVE DATA', 2.7, -2.23, 22, '#5b716a', 'right')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return { texture, width, height }
}
