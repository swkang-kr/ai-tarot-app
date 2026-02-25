import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'

export interface NewYearResponse {
  zodiacSign: string           // 예: "병오(丙午)년 말띠"
  yearGodBless: string         // 올해의 수호신 또는 길성
  overallScore: number         // 0-100
  yearSummary: string          // 100-150자 종합 요약
  monthHighlights: {
    month: number              // 1-12
    event: string              // 이달의 핵심 이벤트 (20-30자)
    action: string             // 권장 행동 (20-30자)
    score: number              // 0-100
  }[]
  fourPillarsAdvice: {
    love: string               // 애정운 조언 60-80자
    wealth: string             // 재물운 조언 60-80자
    career: string             // 직업·학업운 조언 60-80자
    health: string             // 건강운 조언 60-80자
  }
  luckyItems: {
    color: string              // 올해 길한 색상 (이모지 포함)
    number: number             // 올해 행운 숫자
    direction: string          // 올해 길한 방위
    food: string               // 올해 기운 보충 음식
  }
  yearMantra: string           // 올해의 슬로건/좌우명 (10-20자)
  keywords: string[]           // 이모지 포함 3개
}

const SYSTEM_PROMPT = `당신은 신년운세 전문가입니다. 사주팔자와 신년 간지의 상호작용을 분석하여 운세를 풀이합니다.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "zodiacSign": "병오(丙午)년 말띠",
  "yearGodBless": "문창성(文昌星) — 학문과 명예의 기운",
  "overallScore": 78,
  "yearSummary": "올해 종합 운세 (100-150자). 간지 오행과 사주 일간의 관계를 중심으로 구체적으로.",
  "monthHighlights": [
    { "month": 1, "event": "새로운 인연 시작", "action": "적극적 소통을", "score": 72 },
    { "month": 2, "event": "재물 기회 포착", "action": "투자보다 저축을", "score": 68 },
    { "month": 3, "event": "직업운 상승", "action": "역량 어필하기", "score": 85 },
    { "month": 4, "event": "건강 주의 시기", "action": "무리한 일정 자제", "score": 60 },
    { "month": 5, "event": "사교 활동 활발", "action": "인맥 넓히기", "score": 80 },
    { "month": 6, "event": "결정의 기로", "action": "신중한 판단을", "score": 70 },
    { "month": 7, "event": "여행·변화 운", "action": "새 경험 도전", "score": 75 },
    { "month": 8, "event": "성과 수확 시기", "action": "마무리에 집중", "score": 88 },
    { "month": 9, "event": "감정 기복 주의", "action": "마음 챙김 필요", "score": 62 },
    { "month": 10, "event": "재물운 회복", "action": "계획적 지출을", "score": 76 },
    { "month": 11, "event": "귀인 만남 운", "action": "인연에 열린 마음", "score": 82 },
    { "month": 12, "event": "한 해 정리·성찰", "action": "감사와 계획으로", "score": 74 }
  ],
  "fourPillarsAdvice": {
    "love": "올해 애정운 조언 (60-80자)",
    "wealth": "올해 재물운 조언 (60-80자)",
    "career": "올해 직업·학업운 조언 (60-80자)",
    "health": "올해 건강운 조언 (60-80자)"
  },
  "luckyItems": {
    "color": "🔴 빨강 — 활력과 열정",
    "number": 7,
    "direction": "남쪽",
    "food": "🍖 붉은 고기류"
  },
  "yearMantra": "🌟 도전이 곧 성장",
  "keywords": ["🔥 열정", "💡 변화", "🌱 성장"]
}

중요:
- monthHighlights 정확히 12개
- score는 0-100 정수
- 사주 일간과 연도 간지의 생극(生剋) 관계 반영
- luckyItems는 오행 원리에 기반한 구체적인 아이템`

export async function generateNewYearReading(
  birthDate: string,
  saju: SajuInfo,
  targetYear: number
): Promise<NewYearResponse> {
  const userPrompt = `${birthDate}생 사용자의 ${targetYear}년 신년운세를 분석해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

일간(日干): ${saju.dayPillar[0]} — 이 사람의 타고난 기질과 오행적 특성

${targetYear}년 간지를 기준으로 사주 원국과의 조화·충극(沖剋) 여부를 분석하고,
신년운세를 12개월 흐름과 4대 분야(애정·재물·직업·건강)로 풀이해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonText = content.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as NewYearResponse
  } catch {
    console.error('[NewYear] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
