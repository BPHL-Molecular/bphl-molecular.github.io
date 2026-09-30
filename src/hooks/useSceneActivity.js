import { useEffect, useState, useSyncExternalStore } from 'react'

function subscribe(callback) {
  document.addEventListener('visibilitychange', callback)
  window.addEventListener('bphl-menu-change', callback)
  return () => {
    document.removeEventListener('visibilitychange', callback)
    window.removeEventListener('bphl-menu-change', callback)
  }
}
const available = () => !document.hidden && !document.documentElement.dataset.menuOpen

export default function useSceneActivity(region) {
  const foreground = useSyncExternalStore(subscribe, available, () => false)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    if (region.current) observer.observe(region.current)
    return () => observer.disconnect()
  }, [region])
  return foreground && visible
}
