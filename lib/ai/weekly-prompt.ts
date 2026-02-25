import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'

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
  weekDates: string[]
): Promise<WeeklyResponse> {
  const dayNames = ['월', '화', '수', '목', '금', '토', '일']

  const userPrompt = `${birthDate}생 사용자의 이번 주(${weekStart} ~ ${weekDates[6]}) 운세를 분석해주세요.

사주팔자 정보:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

이번 주 날짜:
${weekDates.map((d, i) => `- ${dayNames[i]}요일: ${d}`).join('\n')}

각 날짜의 천간지지와 사주 일간의 상호작용을 분석하여 요일별 운세를 산출해주세요. days 배열의 date 필드에는 위의 실제 날짜를 사용해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
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
