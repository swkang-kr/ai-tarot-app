import { anthropic } from '@/lib/ai/client'
import { calculateSaju } from '@fullstackfamily/manseryeok'
import type { SajuInfo } from '@/lib/utils/saju'
import { getDetailedAnalysis, getYongshin } from '@/lib/utils/saju'

const GAN_HANJA: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
}
const JI_HANJA: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
}

export interface DayFortune {
  day: string        // 월, 화, 수 ...
  date: string       // 2024-01-15
  score: number      // 0-100
  summary: string    // 한줄 운세
}

export interface WeeklyResponse {
  weekSummary: string
  days: DayFortune[]
  bestDay: string       // 최고의 날 (요일)
  worstDay: string      // 주의할 날 (요일)
  weeklyAdvice: string
  keywords: string[]
}

// 천간합(天干合) 쌍 — 합이 되면 기운 융합 (+5점)
const CHEONGAN_HAP_PAIRS: [string, string][] = [
  ['갑', '기'], ['을', '경'], ['병', '신'], ['정', '임'], ['무', '계'],
]
// 천간충(天干冲) 쌍 — 충이 되면 긴장·갈등 (-8점)
const CHEONGAN_CHUNG_PAIRS: [string, string][] = [
  ['갑', '경'], ['을', '신'], ['병', '임'], ['정', '계'],
]
// 삼합(三合) — 인오술(火)·신자진(水)·해묘미(木)·사유축(金)
const SAMHAP_GROUPS: [string, string, string][] = [
  ['인', '오', '술'],
  ['신', '자', '진'],
  ['해', '묘', '미'],
  ['사', '유', '축'],
]
// 방합(方合) — 동방(인묘진/木)·남방(사오미/火)·서방(신유술/金)·북방(해자축/水)
const BANGHAP_GROUPS: [string, string, string][] = [
  ['인', '묘', '진'],
  ['사', '오', '미'],
  ['신', '유', '술'],
  ['해', '자', '축'],
]

const SYSTEM_PROMPT = `당신은 20년 경력의 사주팔자 전문가입니다. 사용자의 이번 주 운세를 분석해주세요.

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "weekSummary": "이번 주 종합 운세 요약 (100-150자). 한 주의 전반적 흐름과 핵심 테마.",
  "days": [
    { "day": "월", "date": "2024-01-15", "score": 75, "summary": "월요일 한줄 운세 (30-50자)" },
    { "day": "화", "date": "2024-01-16", "score": 82, "summary": "화요일 한줄 운세" },
    { "day": "수", "date": "2024-01-17", "score": 60, "summary": "수요일 한줄 운세" },
    { "day": "목", "date": "2024-01-18", "score": 90, "summary": "목요일 한줄 운세" },
    { "day": "금", "date": "2024-01-19", "score": 70, "summary": "금요일 한줄 운세" },
    { "day": "토", "date": "2024-01-20", "score": 85, "summary": "토요일 한줄 운세" },
    { "day": "일", "date": "2024-01-21", "score": 78, "summary": "일요일 한줄 운세" }
  ],
  "bestDay": "목",
  "worstDay": "수",
  "weeklyAdvice": "이번 주를 위한 핵심 조언 (60-80자). 한 주를 잘 보내기 위한 실용적 팁.",
  "keywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"]
}

중요:
- days 배열은 월~일 7개 항목, 각 날짜는 실제 이번 주 날짜
- score는 0-100 정수, 사주와 날짜 천간지지 조합으로 산출
- bestDay: days 배열에서 score가 가장 높은 날의 요일 (동점이면 용신 오행 일치 날 우선)
- worstDay: days 배열에서 score가 가장 낮은 날의 요일 (동점이면 기신 오행·충일 날 우선)
- bestDay/worstDay는 요일만 (월, 화, 수 ...) — days 배열의 score와 반드시 일치해야 함
- 구체적이고 실용적인 조언 포함
- keywords는 이모지+단어 조합 3개`

export async function generateWeeklyReading(
  birthDate: string,
  saju: SajuInfo,
  weekStart: string,
  weekDates: string[],
  bodyStrength?: string
): Promise<WeeklyResponse> {
  const dayNames = ['월', '화', '수', '목', '금', '토', '일']

  // 용신(用神) 사전 계산
  const detail = getDetailedAnalysis(saju)
  const yongshin = getYongshin(saju, detail)

  // 각 날짜의 일진(日辰) 계산
  const dayIljin = weekDates.map(dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const s = calculateSaju(y, m, d)
    const gan = s.dayPillar[0]
    const ji = s.dayPillar[1]
    return `${gan}${ji}(${GAN_HANJA[gan] || ''}${JI_HANJA[ji] || ''})`
  })

  // 신강/신약에 따라 비견일 기준점 동적 설정
  const begyeonBaseScore = bodyStrength === '신강(身强)' ? 50
    : bodyStrength === '신약(身弱)' ? 70 : 65

  // 신강/신약별 십성 점수 기준 — 전통 명리학 억부론(抑扶論) 기반
  // 신강(身强): 설기·제압(食傷·財星·官星)이 좋고, 인성(더 강해짐)이 나쁨
  // 신약(身弱): 보강(印星·比劫)이 좋고, 설기·제압(食傷·財星·官星)이 나쁨
  let bodyStrengthNote: string
  if (bodyStrength === '신강(身强)') {
    bodyStrengthNote = `
- 사용자 신강/신약: ${bodyStrength} → 억부론 적용 (설기·제압이 좋음)
  · 비견일(比肩日): 기준 ${begyeonBaseScore}점 (비겁 과잉으로 부담)
  · 官星일(관성, 나를 극하는 오행): 75점대 → 매우 좋음 (신강 제압 1순위 용신)
  · 財星일(재성, 내가 극하는 오행): 68점대 → 좋음 (설기·소모 2순위)
  · 食傷일(식상, 내가 생하는 오행): 62점대 → 보통~좋음 (설기 3순위)
  · 印星일(인성, 나를 생하는 오행): 35점대 → 나쁨 (신강에게 인성 = 과잉·역효과)`
  } else if (bodyStrength === '신약(身弱)') {
    bodyStrengthNote = `
- 사용자 신강/신약: ${bodyStrength} → 억부론 적용 (보강이 좋음)
  · 비견일(比肩日): 기준 ${begyeonBaseScore}점 (비겁이 도움)
  · 印星일(인성, 나를 생하는 오행): 90점대 → 매우 좋음
  · 食傷일(식상, 내가 생하는 오행): 50점대 → 나쁨 (설기로 더 약해짐)
  · 財星일(재성, 내가 극하는 오행): 55점대 → 나쁨 (신약에게 재성 부담)
  · 官星일(관성, 나를 극하는 오행): 48점대 → 나쁨 (신약에게 관성 부담)`
  } else if (bodyStrength === '종격(從格)') {
    bodyStrengthNote = `
- 사용자 신강/신약: ${bodyStrength} → 억부론 배제, 용신 오행에 순종
  · 용신(${yongshin.yongshinFull}) 오행 일진: 적극 활용 (추가 +10점 권장)
  · 기신(${yongshin.heukshin}) 오행 일진: 역운 (추가 -10점 권장)
  · 비견·인성 관계 무시, 오직 용신/기신 오행 기준으로만 판단`
  } else {
    bodyStrengthNote = bodyStrength
      ? `
- 사용자 신강/신약: ${bodyStrength} (중화) → 균형 기준
  · 비견일(比肩日): 기준 ${begyeonBaseScore}점
  · 印星일(인성): 70점대 → 좋음
  · 食傷일(식상): 65점대 → 좋음
  · 財星일(재성): 55점대
  · 官星일(관성): 50점대`
      : ''
  }

  // 사용자 일지(日支)와 일진 지지의 충일(冲日)/합일(合日) 사전 계산
  const userDayJi = saju.dayPillar[1]
  const CHUNG_PAIRS_W: [string, string][] = [
    ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해'],
  ]
  const YUKHAP_PAIRS_W: [string, string][] = [
    ['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미'],
  ]
  const dayAdjNotes = weekDates.map((dateStr, i) => {
    const [ay, am, ad] = dateStr.split('-').map(Number)
    const s = calculateSaju(ay, am, ad)
    const dayJi = s.dayPillar[1]
    const isChung = CHUNG_PAIRS_W.some(([a, b]) =>
      (dayJi === a && userDayJi === b) || (dayJi === b && userDayJi === a)
    )
    const isHap = YUKHAP_PAIRS_W.some(([a, b]) =>
      (dayJi === a && userDayJi === b) || (dayJi === b && userDayJi === a)
    )
    if (isChung) return `  · ${dayNames[i]}요일: 일지충(日支冲) — 일진 ${dayJi}↔사용자 일지 ${userDayJi} 충 → 추가 -10점`
    if (isHap)   return `  · ${dayNames[i]}요일: 일지합(日支合) — 일진 ${dayJi}↔사용자 일지 ${userDayJi} 합 → 추가 +5점`
    return null
  }).filter(Boolean)
  const dayAdjNote = dayAdjNotes.length > 0
    ? `\n일지 충·합 사전 계산:\n${dayAdjNotes.join('\n')}`
    : ''

  // 사용자 일간(日干)과 일진 천간의 합(合)/충(冲) 사전 계산
  const userDayGan = saju.dayPillar[0]
  const ganAdjNotes = weekDates.map((dateStr, i) => {
    const [ay, am, ad] = dateStr.split('-').map(Number)
    const s = calculateSaju(ay, am, ad)
    const dayGan = s.dayPillar[0]
    const isHap = CHEONGAN_HAP_PAIRS.some(([a, b]) =>
      (dayGan === a && userDayGan === b) || (dayGan === b && userDayGan === a)
    )
    const isChung = CHEONGAN_CHUNG_PAIRS.some(([a, b]) =>
      (dayGan === a && userDayGan === b) || (dayGan === b && userDayGan === a)
    )
    if (isHap) return `  · ${dayNames[i]}요일: 천간합(天干合) — 일진 천간 ${dayGan}↔사용자 일간 ${userDayGan} 합 → 기운 융합 추가 +5점`
    if (isChung) return `  · ${dayNames[i]}요일: 천간충(天干冲) — 일진 천간 ${dayGan}↔사용자 일간 ${userDayGan} 충 → 긴장·갈등 추가 -8점`
    return null
  }).filter(Boolean)
  const ganAdjNote = ganAdjNotes.length > 0
    ? `\n천간 합·충 사전 계산:\n${ganAdjNotes.join('\n')}`
    : ''

  // 사용자 년지(年支)·월지(月支)와 일진 지지의 충합 사전 계산
  const userYearJi = saju.yearPillar[1]
  const userMonthJi = saju.monthPillar[1]
  const yearMonthAdjNotes = weekDates.map((dateStr, i) => {
    const [ay, am, ad] = dateStr.split('-').map(Number)
    const s = calculateSaju(ay, am, ad)
    const dayJi = s.dayPillar[1]
    const notes: string[] = []
    // 년지 충합
    const isYearChung = CHUNG_PAIRS_W.some(([a, b]) =>
      (dayJi === a && userYearJi === b) || (dayJi === b && userYearJi === a)
    )
    const isYearHap = YUKHAP_PAIRS_W.some(([a, b]) =>
      (dayJi === a && userYearJi === b) || (dayJi === b && userYearJi === a)
    )
    if (isYearChung) notes.push(`  · ${dayNames[i]}요일: 년지충(年支冲) — 일진 ${dayJi}↔사용자 년지 ${userYearJi} 충 → 추가 -5점`)
    if (isYearHap)   notes.push(`  · ${dayNames[i]}요일: 년지합(年支合) — 일진 ${dayJi}↔사용자 년지 ${userYearJi} 합 → 추가 +3점`)
    // 월지 충합
    const isMonthChung = CHUNG_PAIRS_W.some(([a, b]) =>
      (dayJi === a && userMonthJi === b) || (dayJi === b && userMonthJi === a)
    )
    const isMonthHap = YUKHAP_PAIRS_W.some(([a, b]) =>
      (dayJi === a && userMonthJi === b) || (dayJi === b && userMonthJi === a)
    )
    if (isMonthChung) notes.push(`  · ${dayNames[i]}요일: 월지충(月支冲) — 일진 ${dayJi}↔사용자 월지 ${userMonthJi} 충 → 추가 -7점`)
    if (isMonthHap)   notes.push(`  · ${dayNames[i]}요일: 월지합(月支合) — 일진 ${dayJi}↔사용자 월지 ${userMonthJi} 합 → 추가 +4점`)
    return notes
  }).flat().filter(Boolean)
  const yearMonthAdjNote = yearMonthAdjNotes.length > 0
    ? `\n년지·월지 충·합 사전 계산:\n${yearMonthAdjNotes.join('\n')}`
    : ''

  // 사용자 사주 지지 목록 (삼합/반합 계산용)
  const userJiList = [
    saju.yearPillar[1], saju.monthPillar[1], saju.dayPillar[1],
    ...(saju.hourPillar ? [saju.hourPillar[1]] : []),
  ]

  // 삼합(三合)/반합(半合) 사전 계산
  const samhapAdjNotes = weekDates.map((dateStr, i) => {
    const [ay, am, ad] = dateStr.split('-').map(Number)
    const s = calculateSaju(ay, am, ad)
    const dayJi = s.dayPillar[1]
    for (const group of SAMHAP_GROUPS) {
      if (!group.includes(dayJi)) continue
      const userMatches = group.filter(ji => ji !== dayJi && userJiList.includes(ji))
      if (userMatches.length === 2) {
        return `  · ${dayNames[i]}요일: 삼합(三合) 완성 — 일진 ${dayJi} + 사주 ${userMatches.join('·')} → 삼합 기운 충만, 추가 +7점`
      } else if (userMatches.length === 1) {
        return `  · ${dayNames[i]}요일: 반합(半合) — 일진 ${dayJi}↔사주 ${userMatches[0]} → 반합 길운, 추가 +3점`
      }
    }
    return null
  }).filter(Boolean)
  const samhapAdjNote = samhapAdjNotes.length > 0
    ? `\n삼합·반합 사전 계산:\n${samhapAdjNotes.join('\n')}`
    : ''

  // 방합(方合)/반방합 사전 계산 — 동/남/서/북 방위별 오행 기운 결집
  const banghapAdjNotes = weekDates.map((dateStr, i) => {
    const [ay, am, ad] = dateStr.split('-').map(Number)
    const s = calculateSaju(ay, am, ad)
    const dayJi = s.dayPillar[1]
    for (const group of BANGHAP_GROUPS) {
      if (!group.includes(dayJi)) continue
      const userMatches = group.filter(ji => ji !== dayJi && userJiList.includes(ji))
      if (userMatches.length === 2) {
        return `  · ${dayNames[i]}요일: 방합(方合) 완성 — 일진 ${dayJi} + 사주 ${userMatches.join('·')} → 방위 오행 기운 집결, 추가 +6점`
      } else if (userMatches.length === 1) {
        return `  · ${dayNames[i]}요일: 반방합(半方合) — 일진 ${dayJi}↔사주 ${userMatches[0]} 방합 부분 → 추가 +3점`
      }
    }
    return null
  }).filter(Boolean)
  const banghapAdjNote = banghapAdjNotes.length > 0
    ? `\n방합·반방합 사전 계산:\n${banghapAdjNotes.join('\n')}`
    : ''

  // 사용자 시지(時支)와 일진 지지의 충합 사전 계산
  const userHourJi = saju.hourPillar ? saju.hourPillar[1] : null
  let hourAdjNote = ''
  if (userHourJi) {
    const hourAdjNotes = weekDates.map((dateStr, i) => {
      const [ay, am, ad] = dateStr.split('-').map(Number)
      const s = calculateSaju(ay, am, ad)
      const dayJi = s.dayPillar[1]
      const isChung = CHUNG_PAIRS_W.some(([a, b]) =>
        (dayJi === a && userHourJi === b) || (dayJi === b && userHourJi === a)
      )
      const isHap = YUKHAP_PAIRS_W.some(([a, b]) =>
        (dayJi === a && userHourJi === b) || (dayJi === b && userHourJi === a)
      )
      if (isChung) return `  · ${dayNames[i]}요일: 시지충(時支冲) — 일진 ${dayJi}↔사용자 시지 ${userHourJi} 충 → 추가 -3점`
      if (isHap)   return `  · ${dayNames[i]}요일: 시지합(時支合) — 일진 ${dayJi}↔사용자 시지 ${userHourJi} 합 → 추가 +2점`
      return null
    }).filter(Boolean)
    hourAdjNote = hourAdjNotes.length > 0
      ? `\n시지 충·합 사전 계산:\n${hourAdjNotes.join('\n')}`
      : ''
  }

  // 형(刑) 관계 사전 계산 — 삼형(寅申巳 / 丑戌未), 자묘 무례지형, 자형(午辰酉亥)
  const SAMHYEONG_GROUPS_W: string[][] = [['인', '신', '사'], ['축', '술', '미']]
  const JAHYEONG_W = new Set(['오', '진', '유', '해'])
  const JAMYO_W: [string, string] = ['자', '묘']
  const hyeongNotes = weekDates.map((dateStr, i) => {
    const [ay, am, ad] = dateStr.split('-').map(Number)
    const s = calculateSaju(ay, am, ad)
    const dayJi = s.dayPillar[1]
    const allUserJi = [
      saju.yearPillar[1], saju.monthPillar[1], saju.dayPillar[1],
      ...(saju.hourPillar ? [saju.hourPillar[1]] : []),
    ]
    // 삼형 체크: 일진 지지가 삼형 그룹에 속하고 사주에 같은 그룹 지지가 있는지
    for (const group of SAMHYEONG_GROUPS_W) {
      if (!group.includes(dayJi)) continue
      const matchCount = group.filter(ji => ji !== dayJi && allUserJi.includes(ji)).length
      if (matchCount >= 2) return `  · ${dayNames[i]}요일: 삼형(三刑) 완성 — 일진 ${dayJi} + 사주 내 ${group.filter(j => j !== dayJi).join('·')} → 갈등·사고·충동 최대 주의, 추가 -8점`
      if (matchCount === 1) {
        const matched = group.find(ji => ji !== dayJi && allUserJi.includes(ji))
        return `  · ${dayNames[i]}요일: 부분형(刑) — 일진 ${dayJi}↔사주 ${matched} 형 관계 → 주의 필요, 추가 -4점`
      }
    }
    // 자묘 무례지형: 자(子)↔묘(卯)
    const isJaMyo = (dayJi === JAMYO_W[0] && allUserJi.includes(JAMYO_W[1])) ||
                    (dayJi === JAMYO_W[1] && allUserJi.includes(JAMYO_W[0]))
    if (isJaMyo) return `  · ${dayNames[i]}요일: 자묘형(子卯刑) — 무례지형, 대인관계 갈등 주의, 추가 -4점`
    // 자형(自刑): 일진 지지가 자형 지지이고 사주에도 같은 지지가 있을 때
    if (JAHYEONG_W.has(dayJi) && allUserJi.includes(dayJi)) return `  · ${dayNames[i]}요일: 자형(自刑) — 일진·사주 ${dayJi} 중복, 자기 소모·과잉 에너지 주의, 추가 -3점`
    return null
  }).filter(Boolean)
  const hyeongNote = hyeongNotes.length > 0
    ? `\n형(刑) 관계 사전 계산:\n${hyeongNotes.join('\n')}`
    : ''

  // 용신/기신 일진 오행 사전 계산 — AI 오행 판단 오류 방지
  const GAN_EL_WY: Record<string, string> = {
    '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
    '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
  }
  const JI_EL_WY: Record<string, string> = {
    '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
    '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수',
  }
  const yongshinShort = yongshin.yongshin
  const heukshinShort = yongshin.heukshin.split('(')[0]
  const yongshinPts = bodyStrength === '종격(從格)' ? '+10' : '+7'
  const heukshinPts = bodyStrength === '종격(從格)' ? '-10' : '-7'
  const yongshinAdjNotes = weekDates.map((dateStr, i) => {
    const [ay, am, ad] = dateStr.split('-').map(Number)
    const s = calculateSaju(ay, am, ad)
    const ganEl = GAN_EL_WY[s.dayPillar[0]] || ''
    const jiEl = JI_EL_WY[s.dayPillar[1]] || ''
    if (ganEl === yongshinShort || jiEl === yongshinShort) {
      return `  · ${dayNames[i]}요일: 용신 오행일(用神日) — 일진 오행(천간:${ganEl}/지지:${jiEl}) 중 용신(${yongshinShort}) 포함 → 추가 ${yongshinPts}점`
    }
    if (ganEl === heukshinShort || jiEl === heukshinShort) {
      return `  · ${dayNames[i]}요일: 기신 오행일(忌神日) — 일진 오행(천간:${ganEl}/지지:${jiEl}) 중 기신(${heukshinShort}) 포함 → 추가 ${heukshinPts}점`
    }
    return null
  }).filter(Boolean)
  const yongshinAdjNote = yongshinAdjNotes.length > 0
    ? `\n용신/기신 일진 오행 사전 계산:\n${yongshinAdjNotes.join('\n')}`
    : ''

  // 공망일(空亡日) 사전 계산 + 공망 해소(空亡解消) 체크
  const gongmangJiList = detail.gongmangPillars?.map((p: { ji: string }) => p.ji) || []
  const gongmangNotes = weekDates.map((dateStr, i) => {
    const [ay, am, ad] = dateStr.split('-').map(Number)
    const s = calculateSaju(ay, am, ad)
    const dayJi = s.dayPillar[1]
    if (gongmangJiList.includes(dayJi)) {
      return `  · ${dayNames[i]}요일: 공망일(空亡日) — 일진 ${dayJi}가 사용자 공망 → 추가 -5점`
    }
    // 공망 해소: 일진 지지가 공망 지지를 충(冲)하면 공망이 해소되어 +3점
    const resolves = gongmangJiList.filter((gji: string) =>
      CHUNG_PAIRS_W.some(([a, b]) => (dayJi === a && gji === b) || (dayJi === b && gji === a))
    )
    if (resolves.length > 0) {
      return `  · ${dayNames[i]}요일: 공망 해소(空亡解消) — 일진 ${dayJi}가 공망 ${resolves.join('·')}을(를) 충(冲) → 공망 해소, 추가 +3점`
    }
    return null
  }).filter(Boolean)
  const gongmangNote = gongmangNotes.length > 0
    ? `\n공망일 사전 계산:\n${gongmangNotes.join('\n')}`
    : ''

  // 일진 간 충(冲) 사전 계산 — 같은 주 내 서로 충이 되는 일진 쌍 (양쪽 날 각각 -5점)
  const allWeekDayJis = weekDates.map(dateStr => {
    const [ay, am, ad] = dateStr.split('-').map(Number)
    return calculateSaju(ay, am, ad).dayPillar[1]
  })
  const interDayChungNotes: string[] = []
  for (let ci = 0; ci < 7; ci++) {
    for (let cj = ci + 1; cj < 7; cj++) {
      const isChung = CHUNG_PAIRS_W.some(([a, b]) =>
        (allWeekDayJis[ci] === a && allWeekDayJis[cj] === b) ||
        (allWeekDayJis[ci] === b && allWeekDayJis[cj] === a)
      )
      if (isChung) {
        interDayChungNotes.push(
          `  · ${dayNames[ci]}요일(${allWeekDayJis[ci]})↔${dayNames[cj]}요일(${allWeekDayJis[cj]}): 일진 간 충(冲) → 양쪽 날 각각 추가 -5점`
        )
      }
    }
  }
  const interDayChungNote = interDayChungNotes.length > 0
    ? `\n일진 간 충(冲) 사전 계산:\n${interDayChungNotes.join('\n')}`
    : ''

  const userPrompt = `${birthDate}생 사용자의 이번 주(${weekStart} ~ ${weekDates[6]}) 운세를 분석해주세요.

사주팔자 정보:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}
- 용신(用神): ${yongshin.yongshinFull} — ${yongshin.reason}
- 희신(喜神): ${yongshin.heungshin}
- 기신(忌神): ${yongshin.heukshin}

이번 주 일진(日辰):
${weekDates.map((d, i) => `- ${dayNames[i]}요일 (${d}): 일진 ${dayIljin[i]}`).join('\n')}

각 날짜의 일진 천간지지와 사주 일간의 오행 상성을 분석하여 요일별 운세를 산출해주세요. days 배열의 date 필드에는 위의 실제 날짜를 사용해주세요.

[일별 점수 산정 기준 — 신강/신약 억부론 + 용신 적용]
- 용신(${yongshin.yongshinFull}) 오행 일진: 기본점에 추가 ${yongshinPts}점 → 아래 사전 계산값 참조
- 기신(${yongshin.heukshin}) 오행 일진: 기본점에 추가 ${heukshinPts}점 → 아래 사전 계산값 참조${bodyStrengthNote}
- 같은 주의 일진 간 충(冲)이 있는 날: 추가 -5점
- 일지충(日支冲): 사용자 일지와 일진 지지가 충이면 추가 -10점
- 일지합(日支合): 사용자 일지와 일진 지지가 육합이면 추가 +5점
- 월지충(月支冲): 사용자 월지와 일진 지지가 충이면 추가 -7점 (직업·사회 관계 영향)
- 월지합(月支合): 사용자 월지와 일진 지지가 합이면 추가 +4점 (사회적 기운 강화)
- 년지충(年支冲): 사용자 년지와 일진 지지가 충이면 추가 -5점 (근본 기운 흔들림)
- 년지합(年支合): 사용자 년지와 일진 지지가 합이면 추가 +3점 (근본 기운 안정)
- 천간합(天干合): 사용자 일간과 일진 천간이 합이면 추가 +5점 (기운 융합)
- 천간충(天干冲): 사용자 일간과 일진 천간이 충이면 추가 -8점 (긴장·갈등)
- 시지충(時支冲): 사용자 시지와 일진 지지가 충이면 추가 -3점 (시간·세부 활동 기운 방해)
- 시지합(時支合): 사용자 시지와 일진 지지가 합이면 추가 +2점 (세부 활동 기운 강화)
- 삼합(三合): 일진 지지 + 사주 지지 2개가 삼합 그룹(인오술·신자진·해묘미·사유축) 완성이면 추가 +7점
- 반합(半合): 일진 지지 + 사주 지지 1개가 삼합 그룹 내 2개 구성이면 추가 +3점
- 방합(方合): 일진 지지 + 사주 지지 2개가 방합 그룹(인묘진·사오미·신유술·해자축) 완성이면 추가 +6점
- 반방합(半方合): 일진 지지 + 사주 지지 1개가 방합 그룹 내 2개 구성이면 추가 +3점
- 공망일(空亡日): 일진 지지가 사용자 공망과 일치하면 추가 -5점 (기대·계획 변수)
- 형(刑): 삼형(인신사/축술미) 부분형 -4점·완성 -8점, 자묘형 -4점, 자형(오진유해) -3점${dayAdjNote}${ganAdjNote}${yearMonthAdjNote}${hourAdjNote}${interDayChungNote}${gongmangNote}${samhapAdjNote}${banghapAdjNote}${hyeongNote}${yongshinAdjNote}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [{ role: 'user', content: userPrompt }]
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  let jsonText = content.text.trim()
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as WeeklyResponse
  } catch (e) {
    console.error('[Weekly] JSON parse failed. Raw:', jsonText.slice(0, 500))
    throw new Error('AI 응답 파싱 실패')
  }
}
