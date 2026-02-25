import { anthropic } from '@/lib/ai/client'
import type { SajuInfo, SajuDetailedAnalysis } from '@/lib/utils/saju'

export interface FortuneCycle {
  period: string       // e.g. "20대 초반"
  theme: string        // e.g. "성장과 도전"
  description: string  // 60-80자
  rating: 1 | 2 | 3 | 4 | 5
}

export interface DeepSajuResponse {
  lifePath: string
  personality: string
  wealthPattern: string
  lovePattern: string
  careerDirection: string
  yongshin: string
  fortuneCycles: FortuneCycle[]
  thisYearAdvice: string
  keywords: string[]
}

const SYSTEM_PROMPT = `당신은 30년 경력의 사주명리학 최고 전문가입니다. 사용자의 사주팔자를 심층 분석하여 삶의 큰 흐름과 패턴을 알려주세요.

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "lifePath": "삶의 큰 흐름과 핵심 과제 (150-200자). 이 사람이 살아가는 근본적인 방향과 인생 테마.",
  "personality": "성격 심층 분석 (150-200자). 일간 오행에서 드러나는 성향, 강점, 약점, 타인과의 관계 방식.",
  "wealthPattern": "재물운 패턴 (100-150자). 재물이 들어오고 나가는 패턴, 재물을 불리는 방법.",
  "lovePattern": "인연 패턴 (100-150자). 어떤 사람과 잘 맞는지, 인연의 특징, 연애/결혼 패턴.",
  "careerDirection": "적성과 직업 방향 (100-150자). 사주에서 드러나는 재능과 어울리는 직업군.",
  "yongshin": "용신(喜神) 분석 (80-120자). 이 사주를 보완하는 오행과 그것을 활용하는 방법.",
  "fortuneCycles": [
    { "period": "10대", "theme": "성장기", "description": "이 시기의 운 흐름 (60-80자)", "rating": 3 },
    { "period": "20대", "theme": "기반 구축", "description": "이 시기의 운 흐름 (60-80자)", "rating": 4 },
    { "period": "30대", "theme": "전성기", "description": "이 시기의 운 흐름 (60-80자)", "rating": 5 },
    { "period": "40대", "theme": "원숙기", "description": "이 시기의 운 흐름 (60-80자)", "rating": 4 },
    { "period": "50대 이후", "theme": "결실기", "description": "이 시기의 운 흐름 (60-80자)", "rating": 3 }
  ],
  "thisYearAdvice": "올해 집중해야 할 것과 주의사항 (80-120자).",
  "keywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"]
}

중요:
- rating은 1-5 정수
- fortuneCycles는 정확히 5개
- 사주 원국의 오행 균형과 일간의 특성을 깊이 분석
- 구체적이고 실용적인 통찰 제공`

export async function generateDeepSaju(
  birthDate: string,
  saju: SajuInfo,
  detail: SajuDetailedAnalysis
): Promise<DeepSajuResponse> {
  const userPrompt = `${birthDate}생 사용자의 사주팔자를 심층 분석해주세요.

사주 원국:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

일간 분석:
- 일간: ${detail.dayMaster.name} (${detail.dayMaster.element})
- 성향: ${detail.dayMaster.trait}
- 설명: ${detail.dayMaster.description}

오행 균형:
${detail.elementBalance.map((e) => `- ${e.name}: ${e.count}개 ${e.emoji}`).join('\n')}
- 강한 오행: ${detail.dominantElement}
- 약한 오행: ${detail.weakElement}

각 주 분석:
${detail.pillarsDetail.map((p) => `- ${p.label}: ${p.hangul ?? '없음'} → 천간(${p.cheonganMeaning}), 지지(${p.jijiMeaning})`).join('\n')}

오행 관계: ${detail.relationships.join(', ')}

위 사주 정보를 바탕으로 이 사람의 삶의 패턴, 성향, 운명적 흐름을 심층 분석해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
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
    return JSON.parse(jsonText) as DeepSajuResponse
  } catch (e) {
    console.error('[DeepSaju] JSON parse failed. Raw:', jsonText.slice(0, 500))
    throw new Error('AI 응답 파싱 실패')
  }
}
