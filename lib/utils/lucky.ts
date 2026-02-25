import { calculateSaju } from '@fullstackfamily/manseryeok'
import type { SajuInfo } from './saju'

// 천간 → 오행 (단축)
const CHEONGAN_ELEMENT_SHORT: Record<string, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
}

// 오행 → 행운 색상
export const ELEMENT_LUCKY_COLOR: Record<string, { name: string; hex: string; emoji: string; desc: string }> = {
  '목': { name: '초록', hex: '#22c55e', emoji: '🌿', desc: '생명력과 성장의 색' },
  '화': { name: '빨강', hex: '#ef4444', emoji: '🔴', desc: '열정과 에너지의 색' },
  '토': { name: '황금', hex: '#eab308', emoji: '🟡', desc: '풍요와 안정의 색' },
  '금': { name: '흰색', hex: '#e2e8f0', emoji: '⚪', desc: '순결과 명확성의 색' },
  '수': { name: '파랑', hex: '#3b82f6', emoji: '🔵', desc: '지혜와 깊이의 색' },
}

// 오행 → 행운 방위
export const ELEMENT_LUCKY_DIRECTION: Record<string, { name: string; emoji: string }> = {
  '목': { name: '동쪽', emoji: '→' },
  '화': { name: '남쪽', emoji: '↓' },
  '토': { name: '중앙', emoji: '⊙' },
  '금': { name: '서쪽', emoji: '←' },
  '수': { name: '북쪽', emoji: '↑' },
}

// 오행 → 행운 음식
export const ELEMENT_LUCKY_FOOD: Record<string, string[]> = {
  '목': ['샐러드', '새싹채소', '시금치', '브로콜리'],
  '화': ['매운 음식', '구운 고기', '커피', '카레'],
  '토': ['꿀', '고구마', '단호박', '두부'],
  '금': ['흰쌀밥', '배', '무', '우유'],
  '수': ['생선회', '미역국', '해산물', '된장'],
}

// 오행 → 행운 숫자
export const ELEMENT_LUCKY_NUMBER: Record<string, number[]> = {
  '목': [3, 8],
  '화': [2, 7],
  '토': [5, 10],
  '금': [4, 9],
  '수': [1, 6],
}

// 오행 → 보완 오행 (상생)
const SANGSAENG: Record<string, string> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
}

export interface LuckyInfo {
  baseElement: string          // 사용자의 일간 오행
  todayElement: string         // 오늘 일진 오행
  boostElement: string         // 오늘 행운 오행 (baseElement를 상생하는 오행)
  color: typeof ELEMENT_LUCKY_COLOR[string]
  direction: typeof ELEMENT_LUCKY_DIRECTION[string]
  food: string                 // 추천 음식 1개 (오늘 날짜 기반 선택)
  luckyNumber: number          // 행운의 숫자
  luckyHour: string            // 행운의 시간대
  score: number                // 오늘 행운 점수 (0-100)
}

export function calculateLucky(saju: SajuInfo, today: Date = new Date()): LuckyInfo {
  // 사용자 일간 오행
  const baseGan = saju.dayPillar[0]
  const baseElement = CHEONGAN_ELEMENT_SHORT[baseGan] || '목'

  // 오늘 일진 계산
  const todaySaju = calculateSaju(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  )
  const todayGan = todaySaju.dayPillar[0]
  const todayElement = CHEONGAN_ELEMENT_SHORT[todayGan] || '목'

  // 행운 오행: 사용자 오행을 상생해주는 오행
  const boostElement = Object.entries(SANGSAENG).find(([, v]) => v === baseElement)?.[0] || baseElement

  const color = ELEMENT_LUCKY_COLOR[boostElement] || ELEMENT_LUCKY_COLOR['목']
  const direction = ELEMENT_LUCKY_DIRECTION[boostElement] || ELEMENT_LUCKY_DIRECTION['목']

  // 오늘 날짜 기반 음식/숫자 선택 (변동성)
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  const foods = ELEMENT_LUCKY_FOOD[boostElement] || ELEMENT_LUCKY_FOOD['목']
  const food = foods[dayOfYear % foods.length]

  const numbers = ELEMENT_LUCKY_NUMBER[boostElement] || [3, 8]
  const luckyNumber = numbers[dayOfYear % numbers.length]

  // 행운의 시간대 (오늘 일진 기반)
  const LUCKY_HOURS: Record<string, string> = {
    '목': '오전 6-8시', '화': '오전 9-11시', '토': '오후 12-2시',
    '금': '오후 3-5시', '수': '저녁 6-8시',
  }
  const luckyHour = LUCKY_HOURS[todayElement] || '오전 9-11시'

  // 행운 점수: 오늘 오행과 사용자 오행의 상성
  let score = 60
  if (todayElement === boostElement) score = 90          // 상생 최강
  else if (SANGSAENG[todayElement] === baseElement) score = 80  // 도움
  else if (SANGSAENG[baseElement] === todayElement) score = 70  // 내가 도움
  else score = 55 + (dayOfYear % 15)                    // 중립

  return { baseElement, todayElement, boostElement, color, direction, food, luckyNumber, luckyHour, score }
}
