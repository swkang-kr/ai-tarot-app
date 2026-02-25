import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'

export interface ManseryeokResponse {
  currentDaeun: {
    period: string      // 예: "35-44세"
    ganji: string       // 예: "무인"
    meaning: string     // 80-100자
    score: number       // 0-100
  }
  nextDaeun: {
    period: string
    ganji: string
    meaning: string
    score: number
  }
  currentSeun: {
    year: number
    ganji: string       // 예: "병오"
    theme: string       // 예: "도약의 해"
    score: number
    advice: string      // 60-80자
  }
  monthlyFlow: {
    month: number       // 1-12
    ganji: string
    score: number       // 0-100
    advice: string      // 30-50자
  }[]
  lifeTimeline: {
    decade: string      // 예: "10대"
    score: number       // 0-100 (rating × 20)
    theme: string
    ganji: string
  }[]
  keywords: string[]
}

const SYSTEM_PROMPT = `당신은 30년 경력의 사주명리 전문가입니다. 사용자의 사주팔자와 대운·세운·월운을 심층 분석합니다.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "currentDaeun": {
    "period": "35-44세",
    "ganji": "무인",
    "meaning": "현재 대운에서 이 사람이 겪는 운명적 흐름 (80-100자)",
    "score": 78
  },
  "nextDaeun": {
    "period": "45-54세",
    "ganji": "기묘",
    "meaning": "다음 대운의 흐름과 준비사항 (80-100자)",
    "score": 85
  },
  "currentSeun": {
    "year": 2026,
    "ganji": "병오",
    "theme": "도약과 변화",
    "score": 75,
    "advice": "올해 세운에서 주의할 점과 활용 방법 (60-80자)"
  },
  "monthlyFlow": [
    { "month": 1, "ganji": "갑자", "score": 72, "advice": "1월 한줄 조언 (30-50자)" },
    { "month": 2, "ganji": "을축", "score": 65, "advice": "2월 한줄 조언" },
    { "month": 3, "ganji": "병인", "score": 80, "advice": "3월 한줄 조언" },
    { "month": 4, "ganji": "정묘", "score": 70, "advice": "4월 한줄 조언" },
    { "month": 5, "ganji": "무진", "score": 88, "advice": "5월 한줄 조언" },
    { "month": 6, "ganji": "기사", "score": 62, "advice": "6월 한줄 조언" },
    { "month": 7, "ganji": "경오", "score": 76, "advice": "7월 한줄 조언" },
    { "month": 8, "ganji": "신미", "score": 82, "advice": "8월 한줄 조언" },
    { "month": 9, "ganji": "임신", "score": 90, "advice": "9월 한줄 조언" },
    { "month": 10, "ganji": "계유", "score": 68, "advice": "10월 한줄 조언" },
    { "month": 11, "ganji": "갑술", "score": 74, "advice": "11월 한줄 조언" },
    { "month": 12, "ganji": "을해", "score": 79, "advice": "12월 한줄 조언" }
  ],
  "lifeTimeline": [
    { "decade": "10대", "score": 60, "theme": "배움의 시기", "ganji": "갑인" },
    { "decade": "20대", "score": 75, "theme": "기반 구축", "ganji": "을묘" },
    { "decade": "30대", "score": 88, "theme": "전성기", "ganji": "병진" },
    { "decade": "40대", "score": 80, "theme": "원숙기", "ganji": "정사" },
    { "decade": "50대", "score": 70, "theme": "안정기", "ganji": "무오" },
    { "decade": "60대+", "score": 72, "theme": "결실기", "ganji": "기미" }
  ],
  "keywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"]
}

중요:
- monthlyFlow는 정확히 12개 (1월~12월)
- lifeTimeline은 6개 (10대~60대+)
- score는 모두 0-100 정수
- 실제 사주 원국과 대운 계산 원리에 기반하여 분석`

export async function generateManseryeok(
  birthDate: string,
  saju: SajuInfo,
  targetYear: number,
  currentAge: number
): Promise<ManseryeokResponse> {
  const userPrompt = `${birthDate}생 (현재 ${currentAge}세) 사용자의 만세력을 분석해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

분석 요청:
1. 현재 대운 및 다음 대운 (10년 주기) — 일간 오행과 대운 간지의 상호작용 분석
2. ${targetYear}년 세운 (年運) — 올해의 흐름과 핵심 테마
3. ${targetYear}년 월운 (月運) — 12개월 흐름
4. 전 생애 대운 타임라인 (10대~60대+)

참고: 대운 시작 나이는 월주 절기와 출생 간의 일수로 계산합니다. 현재 나이(${currentAge}세)를 기준으로 현재·다음 대운을 산정해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  let jsonText = content.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as ManseryeokResponse
  } catch {
    console.error('[Manseryeok] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
