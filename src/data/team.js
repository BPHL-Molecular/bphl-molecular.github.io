import { TEAM_ASSETS } from '../config/assets'

export const team = TEAM_ASSETS.map((image, index) => ({
  name: `Team member ${String(index + 1).padStart(2, '0')}`,
  role: 'Bioinformatics',
  image,
  description: 'Profile and biography coming soon.',
}))
