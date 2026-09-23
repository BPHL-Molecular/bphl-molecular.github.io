import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js'
import { Mesh, Vector3 } from 'three'
import normalizePointCloud, { orderPoints, seededRandom } from '../src/lib/normalizePointCloud.js'
export async function sampleGLB(url, count) {
  const gltf = await new GLTFLoader().loadAsync(url)
  const geometries = [],
    materials = new Set(),
    textures = new Set()
  try {
    gltf.scene.updateMatrixWorld(true)
    const samplers = [],
      random = seededRandom(92)
    let total = 0
    gltf.scene.traverseVisible((object) => {
      if (!object.isMesh) return
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld)
      geometries.push(geometry)
      const sampler = new MeshSurfaceSampler(new Mesh(geometry)).setRandomGenerator(random).build()
      const area = sampler.distribution[sampler.distribution.length - 1]
      if (area > 0) {
        total += area
        samplers.push({ sampler, cumulative: total })
      }
    })
    if (!samplers.length) throw new Error('Model has no visible mesh surfaces.')
    const points = new Float32Array(count * 3),
      point = new Vector3()
    for (let i = 0; i < count; i++) {
      const pick = random() * total
      samplers.find((entry) => entry.cumulative >= pick).sampler.sample(point)
      point.toArray(points, i * 3)
    }
    return orderPoints(normalizePointCloud(points))
  } finally {
    geometries.forEach((geometry) => geometry.dispose())
    gltf.scene.traverse((object) => {
      if (!object.isMesh) return
      object.geometry.dispose()
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material)
        Object.values(material).forEach((value) => {
          if (value?.isTexture) textures.add(value)
        })
      }
    })
    textures.forEach((texture) => texture.dispose())
    materials.forEach((material) => material.dispose())
  }
}
