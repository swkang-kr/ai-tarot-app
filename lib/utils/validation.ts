const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const VALID_BIRTH_HOURS = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21] as const

export function isValidBirthHour(value: unknown): value is number | null {
  if (value === null || value === undefined) return true
  return typeof value === 'number' && VALID_BIRTH_HOURS.includes(value as any)
}

export function isValidBirthDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!DATE_REGEX.test(value)) return false
  const d = new Date(value)
  return !isNaN(d.getTime()) && d <= new Date()
}

const VALID_RELATIONSHIP_TYPES = ['lover', 'friend', 'colleague', 'family'] as const
export type RelationshipType = typeof VALID_RELATIONSHIP_TYPES[number]

export function isValidRelationshipType(value: unknown): value is RelationshipType {
  return typeof value === 'string' && VALID_RELATIONSHIP_TYPES.includes(value as RelationshipType)
}

const VALID_DREAM_CATEGORIES = ['사람', '동물', '장소', '상황', '자연'] as const

export function isValidDreamCategory(value: unknown): value is string {
  return value == null || (typeof value === 'string' && VALID_DREAM_CATEGORIES.includes(value as any))
}

export const MAX_DREAM_CONTENT_LENGTH = 1000
