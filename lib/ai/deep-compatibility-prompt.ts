import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'
import { getSipseong, getNapumOhaeng, getDetailedAnalysis, getYongshin } from '@/lib/utils/saju'

export interface DeepCompatibilityResponse {
  scores: {
    overall: number
    personality: number
    communication: number
    values: number
    growth: number
    physical: number     // 궁합 (신체적 끌림/에너지)
    longterm: number     // 장기적 안정성
  }
  summary: string
  personality: string
  communication: string
  values: string
  advice: string
  bestAspect: string
  challengeAspect: string
  // 심층 추가 필드
  relationshipType: '연인' | '부부' | '친구' | '비즈니스'
  fiveElementAnalysis: string   // 두 사람의 오행 조합 분석 (100-130자)
  conflictPoints: string[]      // 갈등 포인트 3개
  harmonyPoints: string[]       // 조화 포인트 3개
  communicationTips: string     // 구체적 소통 방법 (80-100자)
  fiveyearOutlook: string       // 5년 전망 (80-100자)
  monthlyCompatibility: {
    month: number
    score: number
    theme: string               // 이달의 궁합 테마 (15-20자)
  }[]
  keywords: string[]
}

const SYSTEM_PROMPT = `당신은 20년 경력의 사주팔자 궁합 전문가입니다. 두 사람의 사주를 심층 분석하여 궁합을 봐주세요.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "scores": {
    "overall": 78,
    "personality": 82,
    "communication": 75,
    "values": 80,
    "growth": 70,
    "physical": 85,
    "longterm": 72
  },
  "summary": "두 사람의 궁합 종합 요약 (80-120자)",
  "personality": "성격 궁합 분석 (80-120자)",
  "communication": "대화/소통 궁합 (80-120자)",
  "values": "가치관 궁합 (80-120자)",
  "advice": "관계 개선 조언 (80-120자)",
  "bestAspect": "가장 큰 장점 (40-60자)",
  "challengeAspect": "주의할 점 (40-60자)",
  "relationshipType": "연인",
  "fiveElementAnalysis": "두 일간의 오행 상생/상극 관계 상세 분석 (100-130자). 구체적 오행 관계 명시.",
  "conflictPoints": [
    "갈등 포인트 1 — 구체적 상황 묘사",
    "갈등 포인트 2",
    "갈등 포인트 3"
  ],
  "harmonyPoints": [
    "조화 포인트 1 — 시너지 나는 부분",
    "조화 포인트 2",
    "조화 포인트 3"
  ],
  "communicationTips": "두 사람이 실천할 구체적 소통 방법 (80-100자)",
  "fiveyearOutlook": "이 관계의 5년 후 전망 (80-100자). 현실적으로.",
  "monthlyCompatibility": [
    { "month": 1, "score": 72, "theme": "새로운 시작 에너지" },
    { "month": 2, "score": 65, "theme": "감정 교류 집중" },
    { "month": 3, "score": 80, "theme": "공동 목표 설정" },
    { "month": 4, "score": 70, "theme": "갈등 조율 시기" },
    { "month": 5, "score": 88, "theme": "최고의 교감 달" },
    { "month": 6, "score": 62, "theme": "각자 시간 필요" },
    { "month": 7, "score": 76, "theme": "여행·모험 운" },
    { "month": 8, "score": 82, "theme": "신뢰 쌓이는 달" },
    { "month": 9, "score": 60, "theme": "주의 필요 시기" },
    { "month": 10, "score": 74, "theme": "성숙한 대화" },
    { "month": 11, "score": 85, "theme": "감사와 화합" },
    { "month": 12, "score": 78, "theme": "한 해 마무리" }
  ],
  "keywords": ["💕 이모지 키워드1", "✨ 키워드2", "🌊 키워드3"]
}

중요:
- scores 7개 항목 0-100 정수
- conflictPoints·harmonyPoints 정확히 3개
- monthlyCompatibility 정확히 12개
- 오행 상생/상극 원리에 기반한 과학적 분석
- relationshipType은 요청된 관계 유형 반영`

const RELATION_MAP: Record<string, '연인' | '부부' | '친구' | '비즈니스'> = {
  lover: '연인',
  spouse: '부부',
  friend: '친구',
  business: '비즈니스',
  colleague: '비즈니스',
}

export async function generateDeepCompatibility(
  person1Saju: SajuInfo,
  person2Saju: SajuInfo,
  relationshipType: string,
  person1Birth: string,
  person2Birth: string,
  crossRelations?: string[]
): Promise<DeepCompatibilityResponse> {
  const relLabel = RELATION_MAP[relationshipType] ?? '연인'

  const crossNote = crossRelations && crossRelations.length > 0
    ? `\n두 사람 간 실계산 형·충·합 관계:\n${crossRelations.map(r => `- ${r}`).join('\n')}`
    : '\n두 사람 간 특이 형·충·합: 없음'

  // 십성 교차 분석
  const gan1 = person1Saju.dayPillar[0]
  const gan2 = person2Saju.dayPillar[0]
  const sipseong1sees2 = getSipseong(gan1, gan2)
  const sipseong2sees1 = getSipseong(gan2, gan1)

  // 납음오행(納音五行) — 두 사람 생년 기준 근본 기운 상성
  const napum1 = getNapumOhaeng(person1Saju.yearPillar)
  const napum2 = getNapumOhaeng(person2Saju.yearPillar)
  const SANGSAENG: Record<string, string> = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' }
  const SANGGEUK: Record<string, string> = { '목': '토', '화': '금', '토': '수', '금': '목', '수': '화' }
  let napumRelation: string
  if (napum1.element === napum2.element) {
    napumRelation = '비화(比和) — 같은 납음 동류 결합, 안정적이지만 고집 충돌 가능'
  } else if (SANGSAENG[napum1.element] === napum2.element) {
    napumRelation = `상생(相生) — ${napum1.name}이 ${napum2.name}을 생함, 1번이 2번을 돕는 관계`
  } else if (SANGSAENG[napum2.element] === napum1.element) {
    napumRelation = `상생(相生) — ${napum2.name}이 ${napum1.name}을 생함, 2번이 1번을 돕는 관계`
  } else if (SANGGEUK[napum1.element] === napum2.element) {
    napumRelation = `상극(相剋) — ${napum1.name}이 ${napum2.name}을 극함, 1번이 주도·압박하는 관계`
  } else {
    napumRelation = `상극(相剋) — ${napum2.name}이 ${napum1.name}을 극함, 2번이 주도·압박하는 관계`
  }
  const napumNote = `\n납음오행(納音五行) 근본 기운 상성:
- 첫 번째 사람 생년 납음: ${napum1.name}(${napum1.element})
- 두 번째 사람 생년 납음: ${napum2.name}(${napum2.element})
- 납음 관계: ${napumRelation}`

  // 용신/기신 교차 분석
  const detail1 = getDetailedAnalysis(person1Saju)
  const detail2 = getDetailedAnalysis(person2Saju)
  const yongshin1 = getYongshin(person1Saju, detail1)
  const yongshin2 = getYongshin(person2Saju, detail2)
  const yongshinNote = `\n용신/기신 교차 분석 (궁합 오행 상성의 핵심):
- 첫 번째 사람 신강/신약: ${detail1.bodyStrength} / 용신(用神): ${yongshin1.yongshinFull} / 기신(忌神): ${yongshin1.heukshin}
- 두 번째 사람 신강/신약: ${detail2.bodyStrength} / 용신(用神): ${yongshin2.yongshinFull} / 기신(忌神): ${yongshin2.heukshin}
※ A의 용신 오행 = B의 일간 오행 → A에게 B는 에너지원, 궁합 긍정적
※ A의 기신 오행 = B의 일간 오행 → A에게 B는 스트레스 요인, 갈등 주의
※ 신강+신약 조합: 상호 보완적 역할 분담 가능`

  const userPrompt = `두 사람의 ${relLabel} 궁합을 심층 분석해주세요.

첫 번째 사람 (${person1Birth}생):
- 년주: ${person1Saju.yearPillar} (${person1Saju.yearPillarHanja})
- 월주: ${person1Saju.monthPillar} (${person1Saju.monthPillarHanja})
- 일주: ${person1Saju.dayPillar} (${person1Saju.dayPillarHanja})${person1Saju.hourPillar ? `\n- 시주: ${person1Saju.hourPillar} (${person1Saju.hourPillarHanja})` : ''}

두 번째 사람 (${person2Birth}생):
- 년주: ${person2Saju.yearPillar} (${person2Saju.yearPillarHanja})
- 월주: ${person2Saju.monthPillar} (${person2Saju.monthPillarHanja})
- 일주: ${person2Saju.dayPillar} (${person2Saju.dayPillarHanja})${person2Saju.hourPillar ? `\n- 시주: ${person2Saju.hourPillar} (${person2Saju.hourPillarHanja})` : ''}

십성(十星) 교차 분석 (궁합 핵심 지표):
- ${person1Birth}생(${gan1}) 기준: 상대방(${gan2})은 → ${sipseong1sees2}
- ${person2Birth}생(${gan2}) 기준: 상대방(${gan1})은 → ${sipseong2sees1}
${crossNote}${napumNote}${yongshinNote}

두 일간(日干)의 오행 상생/상극 관계, 납음오행 근본 기운, 십성 교차 분석, 용신/기신 교차 상성, 위에서 실계산된 월지 충합·연지 삼합을 최우선 반영하여
갈등 포인트·조화 포인트·5년 전망·12개월 궁합 흐름까지 심층 분석해주세요.

[심층 궁합 분석 기준]
- 일지(日支) 관계: 궁합에서 가장 중요 — 합이면 감정적 안정, 충이면 갈등·자극
- 일간(日干) 오행 관계: 상생이면 서로 돕는 관계, 상극이면 강한 끌림 또는 갈등
- 월지(月支) 관계: 생활 방식·가치관 조화 판단
- 역마살(驛馬煞): 양쪽 중 한 명에게 있으면 이동·거리 문제 가능성
- 십성 배치: 한 사람의 재성(財星)이 다른 사람의 관성(官星)과 상통하면 인연 깊음`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3500,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonText = content.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as DeepCompatibilityResponse
  } catch {
    console.error('[DeepCompatibility] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
