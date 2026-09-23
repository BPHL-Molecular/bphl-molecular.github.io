import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js'
import { Mesh, ShapeGeometry, Vector3 } from 'three'
import normalizePointCloud, { orderPoints, seededRandom } from './normalizePointCloud.js'
export default async function sampleFlorida(url, count) {
  if (!url) throw new Error('Add florida.svg to src/assets/SVG.')
  const response = await fetch(url)
  if (!response.ok) throw new Error('Florida SVG could not be loaded.')
  const data = new SVGLoader().parse(await response.text())
  const shapes = data.paths.flatMap((path) => path.toShapes())
  if (!shapes.length) throw new Error('Florida SVG must contain a filled path.')
  const geometry = new ShapeGeometry(shapes, 10)
  try {
    const random = seededRandom(56)
    const sampler = new MeshSurfaceSampler(new Mesh(geometry)).setRandomGenerator(random).build()
    const point = new Vector3(),
      points = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      sampler.sample(point)
      points.set([point.x, -point.y, 0], i * 3)
    }
    return orderPoints(normalizePointCloud(points, 4.7))
  } finally {
    geometry.dispose()
  }
}
