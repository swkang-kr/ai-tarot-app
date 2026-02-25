import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'

export interface CompatibilityResponse {
  scores: {
    overall: number
    personality: number
    communication: number
    values: number
    growth: number
  }
  summary: string
  personality: string
  communication: string
  values: string
  advice: string
  bestAspect: string
  challengeAspect: string
}

const SYSTEM_PROMPT = `당신은 20년 경력의 사주팔자 궁합 전문가입니다. 두 사람의 사주를 분석하여 궁합을 봐주세요.

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "scores": {
    "overall": 78,
    "personality": 82,
    "communication": 75,
    "values": 80,
    "growth": 70
  },
  "summary": "두 사람의 궁합 종합 요약 (80-120자). 오행 상생/상극 관계를 바탕으로 분석.",
  "personality": "성격 궁합 분석 (80-120자). 두 사람의 일간 특성이 어떻게 조화되는지.",
  "communication": "대화/소통 궁합 (80-120자). 의사소통 스타일의 조화와 충돌 포인트.",
  "values": "가치관 궁합 (80-120자). 인생관, 금전관, 생활 방식의 일치도.",
  "advice": "관계 개선 조언 (80-120자). 더 좋은 관계를 위해 서로 노력할 부분.",
  "bestAspect": "이 궁합의 가장 큰 장점 (40-60자).",
  "challengeAspect": "이 궁합에서 주의할 점 (40-60자)."
}

중요:
- scores는 각 항목 0-100 정수. 사주 오행 상생/상극을 바탕으로 산출
- 관계 유형(연인/친구/직장동료/가족)에 맞게 톤 조절
- 구체적이고 실용적인 조언 포함
- 긍정적이되 현실적인 분석`

export async function generateCompatibilityReading(
  person1Saju: SajuInfo,
  person2Saju: SajuInfo,
  relationshipType: string
): Promise<CompatibilityResponse> {
  const relationLabels: Record<string, string> = {
    lover: '연인',
    friend: '친구',
    colleague: '직장동료',
    family: '가족',
  }

  const userPrompt = `두 사람의 ${relationLabels[relationshipType] || '연인'} 궁합을 분석해주세요.

첫 번째 사람:
- 년주: ${person1Saju.yearPillar} (${person1Saju.yearPillarHanja})
- 월주: ${person1Saju.monthPillar} (${person1Saju.monthPillarHanja})
- 일주: ${person1Saju.dayPillar} (${person1Saju.dayPillarHanja})${person1Saju.hourPillar ? `\n- 시주: ${person1Saju.hourPillar} (${person1Saju.hourPillarHanja})` : ''}

두 번째 사람:
- 년주: ${person2Saju.yearPillar} (${person2Saju.yearPillarHanja})
- 월주: ${person2Saju.monthPillar} (${person2Saju.monthPillarHanja})
- 일주: ${person2Saju.dayPillar} (${person2Saju.dayPillarHanja})${person2Saju.hourPillar ? `\n- 시주: ${person2Saju.hourPillar} (${person2Saju.hourPillarHanja})` : ''}

두 사주의 오행 상생/상극 관계를 깊이 분석하여 궁합을 봐주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
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
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  let jsonText = content.text.trim()
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as CompatibilityResponse
  } catch (e) {
    console.error('[Compatibility] JSON parse failed. Raw:', jsonText.slice(0, 500))
    throw new Error('AI 응답 파싱 실패')
  }
}
