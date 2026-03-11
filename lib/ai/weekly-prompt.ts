import { anthropic } from '@/lib/ai/client'
import { calculateSaju } from '@fullstackfamily/manseryeok'
import type { SajuInfo } from '@/lib/utils/saju'

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
- bestDay/worstDay는 요일만 (월, 화, 수 ...)
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
    : bodyStrength === '신약(身弱)' ? 70 : 60

  // 신강/신약별 십성 점수 기준 — 전통 명리학 억부론(抑扶論) 기반
  // 신강(身强): 설기·제압(食傷·財星·官星)이 좋고, 인성(더 강해짐)이 나쁨
  // 신약(身弱): 보강(印星·比劫)이 좋고, 설기·제압(食傷·財星·官星)이 나쁨
  let bodyStrengthNote: string
  if (bodyStrength === '신강(身强)') {
    bodyStrengthNote = `
- 사용자 신강/신약: ${bodyStrength} → 억부론 적용 (설기·제압이 좋음)
  · 비견일(比肩日): 기준 ${begyeonBaseScore}점 (비겁 과잉으로 부담)
  · 食傷일(식상, 내가 생하는 오행=설기): 70점대 → 좋음
  · 財星일(재성, 내가 극하는 오행): 62점대 → 보통~좋음
  · 官星일(관성, 나를 극하는 오행): 60점대 → 보통~좋음 (신강 제압)
  · 印星일(인성, 나를 생하는 오행): 35점대 → 나쁨 (신강에게 인성 = 과잉·역효과)`
  } else if (bodyStrength === '신약(身弱)') {
    bodyStrengthNote = `
- 사용자 신강/신약: ${bodyStrength} → 억부론 적용 (보강이 좋음)
  · 비견일(比肩日): 기준 ${begyeonBaseScore}점 (비겁이 도움)
  · 印星일(인성, 나를 생하는 오행): 90점대 → 매우 좋음
  · 食傷일(식상, 내가 생하는 오행): 50점대 → 나쁨 (설기로 더 약해짐)
  · 財星일(재성, 내가 극하는 오행): 55점대 → 나쁨 (신약에게 재성 부담)
  · 官星일(관성, 나를 극하는 오행): 48점대 → 나쁨 (신약에게 관성 부담)`
  } else {
    bodyStrengthNote = bodyStrength
      ? `
- 사용자 신강/신약: ${bodyStrength} (중화) → 균형 기준
  · 비견일(比肩日): 기준 ${begyeonBaseScore}점
  · 印星일(인성): 75점대 → 좋음
  · 食傷일(식상): 70점대 → 좋음
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

  const userPrompt = `${birthDate}생 사용자의 이번 주(${weekStart} ~ ${weekDates[6]}) 운세를 분석해주세요.

사주팔자 정보:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

이번 주 일진(日辰):
${weekDates.map((d, i) => `- ${dayNames[i]}요일 (${d}): 일진 ${dayIljin[i]}`).join('\n')}

각 날짜의 일진 천간지지와 사주 일간의 오행 상성을 분석하여 요일별 운세를 산출해주세요. days 배열의 date 필드에는 위의 실제 날짜를 사용해주세요.

[일별 점수 산정 기준 — 신강/신약 억부론 적용]${bodyStrengthNote}
- 같은 주의 일진 간 충(冲)이 있는 날: 추가 -5점
- 일지충(日支冲): 사용자 일지와 일진 지지가 충이면 추가 -10점
- 일지합(日支合): 사용자 일지와 일진 지지가 육합이면 추가 +5점${dayAdjNote}`

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
