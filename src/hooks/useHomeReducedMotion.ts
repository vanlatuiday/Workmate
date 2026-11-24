import { useExperienceStore } from '@context/experienceStore'
import { useReducedMotion } from './useReducedMotion'

export function useHomeReducedMotion() {
  const reduced = useReducedMotion()
  const light = useExperienceStore((s) => !s.hasChosenQuality || s.quality === 'low')
  return reduced || light
}
