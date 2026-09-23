// Vite resolves only existing assets, so absent optional files never break the build.
// Keep the glob and filename in sync when replacing an asset.
const pointClouds = import.meta.glob('/src/assets/points/pathogen-*.bin', {
  eager: true,
  query: '?url',
  import: 'default',
})
const vectors = import.meta.glob('/src/assets/SVG/florida.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})
const portraits = import.meta.glob('/src/assets/Team/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})
const find = (collection, filename) =>
  Object.entries(collection).find(([path]) => path.endsWith('/' + filename))?.[1] || null
export function pathogenAsset(count) {
  return find(pointClouds, `pathogen-${count}.bin`)
}
export const SVG_ASSETS = {
  florida: find(vectors, 'florida.svg'),
}
export const TEAM_ASSETS = Array.from({ length: 10 }, (_, i) =>
  find(portraits, 'team-placeholder-' + String(i + 1).padStart(2, '0') + '.jpg'),
)
