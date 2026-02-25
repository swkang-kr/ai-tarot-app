import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'

export interface MonthFortune {
  month: number      // 1-12
  score: number      // 0-100
  theme: string      // 테마 (10-20자)
  summary: string    // 월 요약 (40-60자)
  luckyDay: string   // 길일 설명 (5-15자)
  fieldScores: {
    love: number     // 0-100
    wealth: number   // 0-100
    career: number   // 0-100
    health: number   // 0-100
  }
}

export interface AnnualResponse {
  yearSummary: string
  months: MonthFortune[]
  bestMonth: number
  worstMonth: number
  lovePeak: number
  wealthPeak: number
  careerPeak: number
  annualAdvice: string
  keywords: string[]
}

const SYSTEM_PROMPT = `당신은 20년 경력의 사주팔자 전문가입니다. 사용자의 연간 운세를 월별로 상세히 분석해주세요.

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "yearSummary": "올해 전체 운세 흐름 요약 (100-150자). 올해의 핵심 키워드와 전반적 에너지.",
  "months": [
    { "month": 1, "score": 75, "theme": "새로운 시작", "summary": "1월 운세 한줄 요약 (40-60자)", "luckyDay": "10일, 21일", "fieldScores": { "love": 70, "wealth": 65, "career": 80, "health": 75 } },
    { "month": 2, "score": 68, "theme": "내면 성찰", "summary": "2월 운세 한줄 요약", "luckyDay": "5일, 14일", "fieldScores": { "love": 60, "wealth": 70, "career": 65, "health": 80 } },
    { "month": 3, "score": 85, "theme": "도약의 봄", "summary": "3월 운세 한줄 요약", "luckyDay": "3일, 18일", "fieldScores": { "love": 85, "wealth": 75, "career": 90, "health": 80 } },
    { "month": 4, "score": 72, "theme": "관계의 달", "summary": "4월 운세 한줄 요약", "luckyDay": "7일, 22일", "fieldScores": { "love": 80, "wealth": 65, "career": 70, "health": 75 } },
    { "month": 5, "score": 90, "theme": "최고의 시기", "summary": "5월 운세 한줄 요약", "luckyDay": "1일, 15일", "fieldScores": { "love": 95, "wealth": 90, "career": 88, "health": 85 } },
    { "month": 6, "score": 65, "theme": "정비의 시간", "summary": "6월 운세 한줄 요약", "luckyDay": "9일, 25일", "fieldScores": { "love": 60, "wealth": 55, "career": 65, "health": 70 } },
    { "month": 7, "score": 78, "theme": "활동의 여름", "summary": "7월 운세 한줄 요약", "luckyDay": "4일, 19일", "fieldScores": { "love": 75, "wealth": 80, "career": 78, "health": 72 } },
    { "month": 8, "score": 82, "theme": "결실의 예고", "summary": "8월 운세 한줄 요약", "luckyDay": "12일, 27일", "fieldScores": { "love": 78, "wealth": 85, "career": 82, "health": 80 } },
    { "month": 9, "score": 88, "theme": "수확의 계절", "summary": "9월 운세 한줄 요약", "luckyDay": "2일, 16일", "fieldScores": { "love": 82, "wealth": 92, "career": 88, "health": 85 } },
    { "month": 10, "score": 70, "theme": "안정의 달", "summary": "10월 운세 한줄 요약", "luckyDay": "8일, 23일", "fieldScores": { "love": 68, "wealth": 72, "career": 70, "health": 78 } },
    { "month": 11, "score": 75, "theme": "준비의 시간", "summary": "11월 운세 한줄 요약", "luckyDay": "6일, 20일", "fieldScores": { "love": 72, "wealth": 70, "career": 78, "health": 75 } },
    { "month": 12, "score": 80, "theme": "마무리와 감사", "summary": "12월 운세 한줄 요약", "luckyDay": "13일, 28일", "fieldScores": { "love": 78, "wealth": 82, "career": 76, "health": 80 } }
  ],
  "bestMonth": 5,
  "worstMonth": 6,
  "lovePeak": 5,
  "wealthPeak": 9,
  "careerPeak": 3,
  "annualAdvice": "올해 가장 중요한 핵심 메시지와 실천 방안 (80-120자).",
  "keywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"]
}

중요:
- months 배열은 정확히 12개 (1월~12월)
- score는 0-100 정수, 각 달의 천간지지와 사주 일간의 상호작용 반영
- fieldScores의 love/wealth/career/health 각각 0-100 정수 (전체 score와 상관관계 있게)
- bestMonth/worstMonth/lovePeak/wealthPeak/careerPeak은 1-12 정수
- 실제 사주 분석에 기반한 차별화된 월별 운세`

export async function generateAnnualReading(
  birthDate: string,
  saju: SajuInfo,
  targetYear: number
): Promise<AnnualResponse> {
  const userPrompt = `${birthDate}생 사용자의 ${targetYear}년 연간 운세를 월별로 분석해주세요.

사주팔자 정보:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

${targetYear}년 세차(歲次)와 각 월의 천간지지를 사주 원국과 비교하여 월별 운세를 산출해주세요.
특히 애정운, 재물운, 커리어운의 피크 시기를 정확히 분석해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
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
  if (content.type !== 'text') throw new Error('Unexpected response type')

  let jsonText = content.text.trim()
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as AnnualResponse
  } catch (e) {
    console.error('[Annual] JSON parse failed. Raw:', jsonText.slice(0, 500))
    throw new Error('AI 응답 파싱 실패')
  }
}
