import { anthropic } from '@/lib/ai/client'

export interface ScoreTrend {
  trend: '상승' | '하락' | '유지'
  avg: number
}

export interface HistoryAnalysisResponse {
  periodSummary: string
  dominantKeywords: string[]
  scoreTrends: {
    overall: ScoreTrend
    love: ScoreTrend
    wealth: ScoreTrend
    health: ScoreTrend
    career: ScoreTrend
  }
  patternAnalysis: string
  advice: string
  bestPeriodDesc: string
}

const SYSTEM_PROMPT = `당신은 20년 경력의 사주팔자 전문가입니다. 사용자의 최근 운세 기록을 분석하여 패턴과 흐름을 파악해주세요.

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "periodSummary": "기간 운세 전체 흐름 요약 (100-150자). 이 기간의 전반적 에너지와 핵심 테마.",
  "dominantKeywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"],
  "scoreTrends": {
    "overall": { "trend": "상승", "avg": 75 },
    "love": { "trend": "유지", "avg": 68 },
    "wealth": { "trend": "하락", "avg": 55 },
    "health": { "trend": "상승", "avg": 72 },
    "career": { "trend": "상승", "avg": 78 }
  },
  "patternAnalysis": "이 기간 동안 발견된 운세 패턴 분석 (150-200자). 반복되는 테마, 에너지 흐름, 특이 사항.",
  "advice": "앞으로의 방향성 조언 (60-80자). 패턴을 바탕으로 한 실용적 조언.",
  "bestPeriodDesc": "운세가 가장 좋았던 시기 설명 (40-60자)."
}

중요:
- trend는 '상승'/'하락'/'유지' 중 하나
- avg는 0-100 정수
- 키워드는 이모지+단어 조합 3개
- 구체적이고 통찰력 있는 분석`

interface ReadingSummary {
  date: string
  keywords: string[]
  scores: { overall: number; love: number; wealth: number; health: number; career: number } | null
}

export async function generateHistoryAnalysis(
  birthDate: string,
  readings: ReadingSummary[],
  periodLabel: string
): Promise<HistoryAnalysisResponse> {
  const readingText = readings
    .map(
      (r) =>
        `- ${r.date}: 키워드[${r.keywords.join(', ')}] 점수[전체${r.scores?.overall ?? '?'} 애정${r.scores?.love ?? '?'} 재물${r.scores?.wealth ?? '?'} 건강${r.scores?.health ?? '?'} 커리어${r.scores?.career ?? '?'}]`
    )
    .join('\n')

  const userPrompt = `${birthDate}생 사용자의 최근 운세 기록(${periodLabel})을 분석해주세요.

총 ${readings.length}개의 운세 기록:
${readingText}

위 기록을 바탕으로 이 기간의 운세 패턴과 흐름을 분석해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
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
    return JSON.parse(jsonText) as HistoryAnalysisResponse
  } catch (e) {
    console.error('[History] JSON parse failed. Raw:', jsonText.slice(0, 500))
    throw new Error('AI 응답 파싱 실패')
  }
}
