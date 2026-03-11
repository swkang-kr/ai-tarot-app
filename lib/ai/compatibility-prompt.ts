import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'
import { getSipseong, getNapumOhaeng } from '@/lib/utils/saju'

export interface CompatibilityBodyStrength {
  person1: string  // '신강(身强)' | '신약(身弱)' | '중화(中和)'
  person2: string
}

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
  relationshipType: string,
  crossRelations?: string[],
  bodyStrengths?: CompatibilityBodyStrength
): Promise<CompatibilityResponse> {
  const relationLabels: Record<string, string> = {
    lover: '연인',
    friend: '친구',
    colleague: '직장동료',
    family: '가족',
  }

  const crossNote = crossRelations && crossRelations.length > 0
    ? `\n두 사람 간 형·충·합 분석:\n${crossRelations.map(r => `- ${r}`).join('\n')}`
    : ''

  // 십성 교차 분석: 두 사람의 일간 기준 상대방의 십성 계산
  const gan1 = person1Saju.dayPillar[0]
  const gan2 = person2Saju.dayPillar[0]
  const sipseong1sees2 = getSipseong(gan1, gan2) // person1 기준 person2는 어떤 십성인가
  const sipseong2sees1 = getSipseong(gan2, gan1) // person2 기준 person1은 어떤 십성인가

  // 납음오행(納音五行) — 두 사람 생년 기준 근본 기운 상성
  const napum1 = getNapumOhaeng(person1Saju.yearPillar)
  const napum2 = getNapumOhaeng(person2Saju.yearPillar)
  const SANGSAENG_NAPUM: Record<string, string> = {
    '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
  }
  const SANGGEUK_NAPUM: Record<string, string> = {
    '목': '토', '화': '금', '토': '수', '금': '목', '수': '화',
  }
  let napumRelation: string
  if (napum1.element === napum2.element) {
    napumRelation = '비화(比和) — 같은 납음으로 동류 결합, 안정적이지만 고집 충돌 가능'
  } else if (SANGSAENG_NAPUM[napum1.element] === napum2.element) {
    napumRelation = `상생(相生) — ${napum1.name}이 ${napum2.name}을 생함, 1번이 2번을 돕는 관계`
  } else if (SANGSAENG_NAPUM[napum2.element] === napum1.element) {
    napumRelation = `상생(相生) — ${napum2.name}이 ${napum1.name}을 생함, 2번이 1번을 돕는 관계`
  } else if (SANGGEUK_NAPUM[napum1.element] === napum2.element) {
    napumRelation = `상극(相剋) — ${napum1.name}이 ${napum2.name}을 극함, 1번이 주도·압박하는 관계`
  } else {
    napumRelation = `상극(相剋) — ${napum2.name}이 ${napum1.name}을 극함, 2번이 주도·압박하는 관계`
  }
  const napumNote = `\n납음오행(納音五行) 근본 기운 상성:
- 첫 번째 사람 생년 납음: ${napum1.name}(${napum1.element})
- 두 번째 사람 생년 납음: ${napum2.name}(${napum2.element})
- 납음 관계: ${napumRelation}`

  // 신강/신약 상보성(相補性) 분석 노트
  const bodyStrengthNote = bodyStrengths
    ? `\n신강/신약 분석:
- 첫 번째 사람: ${bodyStrengths.person1}
- 두 번째 사람: ${bodyStrengths.person2}
※ 신강+신약 조합은 상호 보완적 궁합, 신강+신강은 주도권 갈등 가능, 신약+신약은 의존적 관계 경향`
    : ''

  const userPrompt = `두 사람의 ${relationLabels[relationshipType] || '연인'} 궁합을 분석해주세요.

첫 번째 사람:
- 년주: ${person1Saju.yearPillar} (${person1Saju.yearPillarHanja})
- 월주: ${person1Saju.monthPillar} (${person1Saju.monthPillarHanja})
- 일주: ${person1Saju.dayPillar} (${person1Saju.dayPillarHanja})${person1Saju.hourPillar ? `\n- 시주: ${person1Saju.hourPillar} (${person1Saju.hourPillarHanja})` : ''}

두 번째 사람:
- 년주: ${person2Saju.yearPillar} (${person2Saju.yearPillarHanja})
- 월주: ${person2Saju.monthPillar} (${person2Saju.monthPillarHanja})
- 일주: ${person2Saju.dayPillar} (${person2Saju.dayPillarHanja})${person2Saju.hourPillar ? `\n- 시주: ${person2Saju.hourPillar} (${person2Saju.hourPillarHanja})` : ''}

십성(十星) 교차 분석 (궁합의 핵심):
- 첫 번째 사람(${gan1}) 기준: 두 번째 사람(${gan2})은 → ${sipseong1sees2}
- 두 번째 사람(${gan2}) 기준: 첫 번째 사람(${gan1})은 → ${sipseong2sees1}
${crossNote}${napumNote}${bodyStrengthNote}
두 사주의 오행 상생/상극 관계, 납음오행 근본 기운, 위 형·충·합 분석, 십성 관계, 신강/신약 상보성을 깊이 반영하여 궁합을 봐주세요.

[궁합 판단 핵심 기준]
- 일지(日支) 관계가 궁합에서 가장 중요: 일지 합(合)은 감정적 안정, 일지 충(冲)은 갈등
- 두 사람 일간(日干)의 오행 상생/상극: 상생이면 조화, 상극이면 갈등 가능성
- 월지(月支) 관계: 가치관·생활 방식의 조화도 판단 기준
- 신강/신약 상보성: 신강+신약 조합이 역할 분담 측면에서 이상적`

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
