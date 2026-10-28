import type { MatchLevel } from '@/types'

export function getMatchLevel(score: number): MatchLevel {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  if (score >= 40) return 'possible'
  return 'low'
}

const MATCH_LABELS: Record<MatchLevel, string> = {
  high:     'Rất phù hợp',
  medium:   'Phù hợp',
  possible: 'Có thể phù hợp',
  low:      'Không phù hợp',
}

export function getMatchLabel(level: MatchLevel): string {
  return MATCH_LABELS[level]
}

const MATCH_COLORS: Record<MatchLevel, string> = {
  high:     'text-green-600 bg-green-50',
  medium:   'text-yellow-600 bg-yellow-50',
  possible: 'text-orange-500 bg-orange-50',
  low:      'text-red-500 bg-red-50',
}

export function getMatchColor(level: MatchLevel): string {
  return MATCH_COLORS[level]
}
