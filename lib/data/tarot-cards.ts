import { getAllCards, getMajorArcana, drawCards as tarotapDraw } from 'tarotap'
import type { TarotCard as TarotapCard } from 'tarotap'

export interface TarotCard {
  id: string
  name: string
  nameEn: string
  symbol: string
}

// Major Arcana symbol mapping
const MAJOR_SYMBOLS: Record<string, string> = {
  'the-fool': '🃏',
  'the-magician': '🪄',
  'the-high-priestess': '🌙',
  'the-empress': '👑',
  'the-emperor': '🏛️',
  'the-hierophant': '📿',
  'the-lovers': '💕',
  'the-chariot': '⚡',
  'strength': '🦁',
  'the-hermit': '🏔️',
  'wheel-of-fortune': '🎡',
  'justice': '⚖️',
  'the-hanged-man': '🔄',
  'death': '🦋',
  'temperance': '⏳',
  'the-devil': '🔥',
  'the-tower': '🗼',
  'the-star': '⭐',
  'the-moon': '🌕',
  'the-sun': '☀️',
  'judgement': '📯',
  'the-world': '🌍',
}

// Minor Arcana suit symbols
const SUIT_SYMBOLS: Record<string, string> = {
  'wands': '🪄',
  'cups': '🏆',
  'swords': '⚔️',
  'pentacles': '🪙',
}

function getSymbol(id: string): string {
  if (MAJOR_SYMBOLS[id]) return MAJOR_SYMBOLS[id]
  for (const [suit, symbol] of Object.entries(SUIT_SYMBOLS)) {
    if (id.includes(suit)) return symbol
  }
  return '🔮'
}

// Build merged card data (Korean name + English name + symbol)
const koCards = getAllCards('ko')
const enCards = getAllCards('en')

const enNameMap = new Map<string, string>()
enCards.forEach(c => enNameMap.set(c.id, c.name))

export const allCards: TarotCard[] = koCards.map(c => ({
  id: c.id,
  name: c.name,
  nameEn: enNameMap.get(c.id) || c.id,
  symbol: getSymbol(c.id),
}))

export const majorArcana: TarotCard[] = allCards.filter(c => MAJOR_SYMBOLS[c.id])
export const minorArcana: TarotCard[] = allCards.filter(c => !MAJOR_SYMBOLS[c.id])

export function getRandomCards(count: number): TarotCard[] {
  const drawn = tarotapDraw(count, false, 'ko')
  return drawn.map(c => allCards.find(a => a.id === c.id)!)
}
