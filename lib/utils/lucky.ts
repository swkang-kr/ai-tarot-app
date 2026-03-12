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

// 오행 → 행운 색상 (오방색 五方色: 木=靑, 火=赤, 土=黃, 金=白, 水=黑)
export const ELEMENT_LUCKY_COLOR: Record<string, { name: string; hex: string; emoji: string; desc: string }> = {
  '목': { name: '청색', hex: '#22c55e', emoji: '🌿', desc: '동방 청기(靑氣) - 생명과 성장의 색' },
  '화': { name: '적색', hex: '#ef4444', emoji: '🔴', desc: '남방 적기(赤氣) - 열정과 생동의 색' },
  '토': { name: '황색', hex: '#eab308', emoji: '🟡', desc: '중앙 황기(黃氣) - 풍요와 안정의 색' },
  '금': { name: '백색', hex: '#e2e8f0', emoji: '⚪', desc: '서방 백기(白氣) - 순결과 결단의 색' },
  '수': { name: '흑색', hex: '#1e3a5f', emoji: '🔵', desc: '북방 흑기(黑氣) - 지혜와 심오함의 색' },
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

// 일진 천간 표시명
const GAN_NAME: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
}
// 일진 지지 표시명
const JI_NAME: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
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
  /** 오늘 일진 한글+한자 (예: "갑자(甲子)") */
  todayIljin: string
  /** 오늘 일진 의미 */
  todayIljinMeaning: string
}

export function calculateLucky(saju: SajuInfo, today: Date = new Date(), bodyStrength?: string): LuckyInfo {
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
  const todayJi  = todaySaju.dayPillar[1]
  const todayElement = CHEONGAN_ELEMENT_SHORT[todayGan] || '목'

  // 일진 표시 (한글+한자)
  const todayIljin = `${todayGan}${todayJi}(${GAN_NAME[todayGan] || ''}${JI_NAME[todayJi] || ''})`

  // 일진 의미 — 천간 + 지지 조합 기반 상세 의미
  const GAN_MEANING_SHORT: Record<string, string> = {
    '갑': '창시·결단', '을': '유연·적응', '병': '열정·표현', '정': '섬세·배려',
    '무': '중용·신뢰', '기': '포용·실용', '경': '의지·결단', '신': '정확·예리',
    '임': '지혜·포용', '계': '직관·감성',
  }
  const JI_MEANING_SHORT: Record<string, string> = {
    '자': '지혜·새시작', '축': '인내·축적', '인': '도전·활동', '묘': '성장·예술',
    '진': '변화·도약', '사': '집중·추진', '오': '열정·표현', '미': '조화·완성',
    '신': '결실·변혁', '유': '수확·정확', '술': '마무리·신뢰', '해': '휴식·지혜',
  }
  const ganMeaning = GAN_MEANING_SHORT[todayGan] || '다양한'
  const jiMeaning = JI_MEANING_SHORT[todayJi] || '에너지'
  const todayIljinMeaning = `${ganMeaning}의 기운과 ${jiMeaning}의 기운이 교차하는 날`

  // 행운 오행: 신강/신약 기반 용신(用神) 오행
  // 신강(身强) → 식상(食傷)=내가 생하는 오행 (설기·소모로 균형)
  // 신약(身弱) → 인성(印星)=나를 생하는 오행 (보충으로 균형)
  // 중화(中和) → 비겁(比劫)=나와 같은 오행 (현상 유지)
  let boostElement: string
  if (bodyStrength === '신강(身强)') {
    // 식상(食傷): 내가 생하는 오행
    boostElement = SANGSAENG[baseElement] || baseElement
  } else if (bodyStrength === '중화(中和)') {
    // 중화: 같은 오행(비겁)으로 현상 유지
    boostElement = baseElement
  } else {
    // 신약(身弱) 또는 미지정: 인성(印星)=나를 생하는 오행
    boostElement = Object.entries(SANGSAENG).find(([, v]) => v === baseElement)?.[0] || baseElement
  }

  const color = ELEMENT_LUCKY_COLOR[boostElement] || ELEMENT_LUCKY_COLOR['목']
  const direction = ELEMENT_LUCKY_DIRECTION[boostElement] || ELEMENT_LUCKY_DIRECTION['목']

  // 오늘 날짜 기반 음식/숫자 선택 (변동성)
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  const foods = ELEMENT_LUCKY_FOOD[boostElement] || ELEMENT_LUCKY_FOOD['목']
  const food = foods[dayOfYear % foods.length]

  const numbers = ELEMENT_LUCKY_NUMBER[boostElement] || [3, 8]
  const luckyNumber = numbers[dayOfYear % numbers.length]

  // 행운의 시간대 (오늘 일진 기반) — 십이시진 오행 정확 매핑
  // 木: 寅(3-5시)·卯(5-7시) / 火: 巳(9-11시)·午(11-13시)
  // 土: 辰(7-9시)·未(13-15시)·戌(19-21시)·丑(1-3시) (토는 진시 대표)
  // 金: 申(15-17시)·酉(17-19시) / 水: 亥(21-23시)·子(23-1시)
  const LUCKY_HOURS: Record<string, string> = {
    '목': '오전 5-7시 (묘시)',      // 묘(卯)는 木
    '화': '오전 9-11시 (사시)',     // 사(巳)는 火
    '토': '오전 7-9시 (진시)',      // 진(辰)은 土 — 기존 오(午·火) 오류 수정
    '금': '오후 3-5시 (신시)',      // 신(申)은 金
    '수': '오후 9-11시 (해시)',     // 해(亥)는 水 — 기존 유(酉·金) 오류 수정
  }
  const luckyHour = LUCKY_HOURS[boostElement] || '오전 9-11시'

  // 행운 점수: 오늘 오행과 용신(boostElement) 오행의 상성
  // ── 용신 기준 비교로 신강/신약 역전 문제 해결 ──────────────
  // 신강: 용신=식상(설기 필요) → 식상 오는 날 최고, 인성 오는 날 나쁨
  // 신약: 용신=인성(보강 필요) → 인성 오는 날 최고, 식상 오는 날 나쁨
  const SANGGEUK: Record<string, string> = {
    '목': '토', '화': '금', '토': '수', '금': '목', '수': '화',
  }
  let score = 60
  if (todayElement === boostElement) score = 90                      // 용신 오행 일치 → 최고
  else if (SANGSAENG[todayElement] === boostElement) score = 80      // 오늘이 용신 강화 → 매우 좋음
  else if (SANGSAENG[boostElement] === todayElement) score = 70      // 용신이 오늘을 생(설기) → 좋음
  else if (SANGGEUK[todayElement] === boostElement) score = 40       // 오늘이 용신 극함(기신) → 나쁨
  else if (SANGGEUK[boostElement] === todayElement) score = 52       // 용신이 오늘 극함 → 보통
  else score = 55 + (dayOfYear % 15)                                 // 무관 → 중립

  // ── 일진 지지(地支) 오행 보정 ──────────────────────────────
  // 지지 오행은 뿌리가 깊어 천간보다 강하게 작용 (보정 ±7)
  const JIJI_EL_SHORT: Record<string, string> = {
    '자': '수', '축': '토', '인': '목', '묘': '목',
    '진': '토', '사': '화', '오': '화', '미': '토',
    '신': '금', '유': '금', '술': '토', '해': '수',
  }
  const todayJiEl = JIJI_EL_SHORT[todayJi] || ''
  if (todayJiEl) {
    // 지지 오행 보정: 용신(boostElement) 기준 (천간 보정과 동일 기준)
    if (SANGSAENG[todayJiEl] === boostElement) score = Math.min(100, score + 7)  // 지지가 용신 생함
    else if (SANGGEUK[todayJiEl] === boostElement) score = Math.max(10, score - 7) // 지지가 용신 극함
  }

  // ── 충일(冲日): 일진 지지와 사용자 일지(日支) 충이면 변동·불안 -10 ─
  const CHUNG_PAIRS: [string, string][] = [
    ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해'],
  ]
  const userDayJi = saju.dayPillar[1]
  const isChungDay = CHUNG_PAIRS.some(
    ([a, b]) => (todayJi === a && userDayJi === b) || (todayJi === b && userDayJi === a)
  )
  if (isChungDay) score = Math.max(10, score - 10)

  // ── 합일(合日): 일진 지지와 사용자 일지 육합이면 조화 +5 ──────
  const YUKHAP_PAIRS: [string, string][] = [
    ['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미'],
  ]
  const isHapDay = YUKHAP_PAIRS.some(
    ([a, b]) => (todayJi === a && userDayJi === b) || (todayJi === b && userDayJi === a)
  )
  if (isHapDay) score = Math.min(100, score + 5)

  // 계절 보정: 절기(節氣) 기준 월지(月支) 오행 — calculateSaju가 절기 기반으로 정확히 계산
  // (양력 월이 아닌 절기 기준이므로 입춘 전 2월도 정확히 축월로 처리)
  const seasonElement = JIJI_EL_SHORT[todaySaju.monthPillar[1]] || '목'

  // 계절 오행이 용신을 극하면 -5, 용신 오행이 왕성(得令)하면 +5
  if (SANGGEUK[seasonElement] === boostElement) score = Math.max(10, score - 5)
  else if (seasonElement === boostElement) score = Math.min(100, score + 5)

  return {
    baseElement, todayElement, boostElement,
    color, direction, food, luckyNumber, luckyHour, score,
    todayIljin, todayIljinMeaning,
  }
}
