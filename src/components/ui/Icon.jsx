import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowDownLeft,
  Menu,
  X,
  Plus,
  ChevronRight,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react'

const icons = {
  'arrow-up-right': ArrowUpRight,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  'arrow-down-left': ArrowDownLeft,
  menu: Menu,
  close: X,
  plus: Plus,
  chevron: ChevronRight,
  pause: Pause,
  play: Play,
  refresh: RefreshCw,
}
export default function Icon({ name, size = 20, className = '' }) {
  const Glyph = icons[name]
  return (
    <Glyph
      className={`ui-icon ${className}`}
      size={size}
      strokeWidth={1.75}
      aria-hidden="true"
      focusable="false"
    />
  )
}
