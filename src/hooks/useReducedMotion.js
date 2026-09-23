import { useSyncExternalStore } from 'react'
const query = '(prefers-reduced-motion: reduce)'
function subscribe(callback) {
  const media = matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
export default function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => true,
  )
}
