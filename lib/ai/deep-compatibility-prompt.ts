import { anthropic } from '@/lib/ai/client'
import { calculateSaju } from '@fullstackfamily/manseryeok'
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
- scores 7개 항목 0-100 정수. 아래 가중치 기준으로 산출하세요
- conflictPoints·harmonyPoints 정확히 3개
- monthlyCompatibility 정확히 12개
- 오행 상생/상극 원리에 기반한 과학적 분석
- relationshipType은 요청된 관계 유형 반영

[scores 산정 가중치 기준]
· overall — 아래 요소 가중합 정규화:
  - 일지(日支) 합(合): +20~25점 / 일지 충(冲): -20~25점 / 삼합·반합: +12점 (30% 비중)
  - 일간 오행 상생: +12~15점 / 상극: -10~12점 / 비화: +5점 (20% 비중)
  - 용신↔상대 일간 교차: 양방향 +15점 / 단방향 +8점 / 양방향 기신 -12점 (15% 비중)
  - 천간합(天干合): +12점 (10% 비중)
  - 납음오행 상성: 상생 +8점 / 상극 -6점 (10% 비중)
  - 신강/신약 상보성: 신강+신약 +8점 / 동일 +2점 (10% 비중)
  - 월지 합/충: +5점 / -5점 (5% 비중)
· personality — 일간 오행 상생/상극 + 신강/신약 조합 + 십성(비견/겁재 비율) 중심
· communication — 월지 합/충 + 식상·관성 십성 교차 + 원진살 유무 중심
· values — 납음오행 상성 + 월간 십성 교차 + 신강/신약 생활 패턴 중심
· growth — 용신↔상대 일간 교차 + 신강/신약 상보성 + 천간합 여부 중심
· physical — 일지 합/충 + 홍염살·도화살 보유 여부 + 일간 오행 상생 중심
· longterm — 삼합·반합 + 천간합 + 납음오행 상성 + 일지 관계 종합 중심

[matchLevel 기준 — summary에 자연스럽게 반영]
- 85점 이상: 천생연분 / 70~84점: 좋은 궁합 / 55~69점: 보통 궁합 / 54점 이하: 주의 필요`

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
    ? `\n두 사람 간 실계산 형·충·합·해·파 관계:\n${crossRelations.map(r => `- ${r}`).join('\n')}`
    : '\n두 사람 간 특이 형·충·합·해·파: 없음'

  // 십성 교차 분석
  const gan1 = person1Saju.dayPillar[0]
  const gan2 = person2Saju.dayPillar[0]
  const sipseong1sees2 = getSipseong(gan1, gan2)
  const sipseong2sees1 = getSipseong(gan2, gan1)

  // 월간(月干) 십성 교차 — 사회적 가치관·역할 분담 기준
  const monthGan1 = person1Saju.monthPillar[0]
  const monthGan2 = person2Saju.monthPillar[0]
  const monthSipseong1sees2 = getSipseong(monthGan1, monthGan2)
  const monthSipseong2sees1 = getSipseong(monthGan2, monthGan1)

  // 천간합(天干合) — 두 사람 일간이 합을 이루면 강한 인연·끌림의 기운
  const CHEONGAN_HAP_DC: Record<string, { partner: string; result: string; meaning: string }> = {
    '갑': { partner: '기', result: '土', meaning: '甲己합(土) — 신뢰·포용의 인연, 서로 안정감을 줌' },
    '기': { partner: '갑', result: '土', meaning: '甲己합(土) — 신뢰·포용의 인연, 서로 안정감을 줌' },
    '을': { partner: '경', result: '金', meaning: '乙庚합(金) — 과감한 결단의 인연, 서로 성장 자극' },
    '경': { partner: '을', result: '金', meaning: '乙庚합(金) — 과감한 결단의 인연, 서로 성장 자극' },
    '병': { partner: '신', result: '水', meaning: '丙辛합(水) — 지혜로운 조화, 서로 다른 매력에 끌림' },
    '신': { partner: '병', result: '水', meaning: '丙辛합(水) — 지혜로운 조화, 서로 다른 매력에 끌림' },
    '정': { partner: '임', result: '木', meaning: '丁壬합(木) — 열정적 도약의 인연, 함께 성장' },
    '임': { partner: '정', result: '木', meaning: '丁壬합(木) — 열정적 도약의 인연, 함께 성장' },
    '무': { partner: '계', result: '火', meaning: '戊癸합(火) — 열정적 융합, 강렬한 끌림' },
    '계': { partner: '무', result: '火', meaning: '戊癸합(火) — 열정적 융합, 강렬한 끌림' },
  }
  const hapInfoDC = CHEONGAN_HAP_DC[gan1]
  const cheonganHapNoteDC = (hapInfoDC && hapInfoDC.partner === gan2)
    ? `\n일간 천간합(天干合): ${hapInfoDC.meaning}\n※ 두 일간이 합을 이루어 강한 인연의 기운 — 만남 자체가 운명적`
    : ''

  const SIPSEONG_COMPAT_MEANING: Record<string, string> = {
    '비견(比肩)': '동등한 경쟁자·동료 (공감대↑, 주도권 갈등 가능)',
    '겁재(劫財)': '강한 자극·경쟁 (활력↑, 재물 갈등)',
    '식신(食神)': '편안한 지지자 (온화한 관계, 의지)',
    '상관(傷官)': '예리한 비평자 (자극↑, 갈등·비판)',
    '정재(正財)': '현실적 파트너 (재물 연결, 안정)',
    '편재(偏財)': '매력적·변화무쌍 (설렘↑, 변덕)',
    '정관(正官)': '나를 이끄는 지도자 (존경·의존, 통제감)',
    '편관(偏官)': '강한 자극·압박 (도전·성장, 갈등)',
    '정인(正印)': '포용하는 어머니상 (수용·안정, 의존)',
    '편인(偏印)': '독창적·신비로운 (매력·불안정, 독특함)',
  }

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

  // 현재 연도 12개월 월운 사전 계산 (monthlyCompatibility score 기준)
  const currentYearDC = new Date().getFullYear()
  const CHUNG_DC: [string, string][] = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']]
  const YUKHAP_DC: [string, string][] = [['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미']]
  const ji1DC = person1Saju.dayPillar[1]
  const ji2DC = person2Saju.dayPillar[1]
  const monthlyPillarsDC = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const s = calculateSaju(currentYearDC, m, 20)
    const mJi = s.monthPillar[1]
    const adj: string[] = []
    if (CHUNG_DC.some(([a,b]) => (mJi===a&&ji1DC===b)||(mJi===b&&ji1DC===a))) adj.push('1번일지충(-7점)')
    if (YUKHAP_DC.some(([a,b]) => (mJi===a&&ji1DC===b)||(mJi===b&&ji1DC===a))) adj.push('1번일지합(+5점)')
    if (CHUNG_DC.some(([a,b]) => (mJi===a&&ji2DC===b)||(mJi===b&&ji2DC===a))) adj.push('2번일지충(-7점)')
    if (YUKHAP_DC.some(([a,b]) => (mJi===a&&ji2DC===b)||(mJi===b&&ji2DC===a))) adj.push('2번일지합(+5점)')
    const adjStr = adj.length > 0 ? ` [${adj.join(' ')}]` : ''
    return `${m}월: ${s.monthPillar}(${s.monthPillarHanja})${adjStr}`
  }).join('\n')

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
[일간 기준 — 개인 정체성·핵심 관계]
- ${person1Birth}생(${gan1}) 기준: 상대방(${gan2})은 → ${sipseong1sees2} (${SIPSEONG_COMPAT_MEANING[sipseong1sees2] || ''})
- ${person2Birth}생(${gan2}) 기준: 상대방(${gan1})은 → ${sipseong2sees1} (${SIPSEONG_COMPAT_MEANING[sipseong2sees1] || ''})
[월간 기준 — 사회적 역할·가치관·생활 방식]
- 첫 번째 월간(${monthGan1}) 기준: 두 번째 월간(${monthGan2})은 → ${monthSipseong1sees2} (${SIPSEONG_COMPAT_MEANING[monthSipseong1sees2] || ''})
- 두 번째 월간(${monthGan2}) 기준: 첫 번째 월간(${monthGan1})은 → ${monthSipseong2sees1} (${SIPSEONG_COMPAT_MEANING[monthSipseong2sees1] || ''})
${cheonganHapNoteDC}${crossNote}${napumNote}${yongshinNote}

[${currentYearDC}년 월운 간지 — monthlyCompatibility score 산출 기준]
${monthlyPillarsDC}
※ 각 월의 오행이 두 사람 모두의 용신(用神) 오행이면 해당 월 score +5~8
※ 한 사람의 용신, 다른 한 사람의 기신이 겹치면 score ±0~3 (혼재)
※ 두 사람 모두의 기신(忌神) 오행이면 해당 월 score -5~8
※ [1번일지충] 달: score -7점 / [1번일지합] 달: score +5점 (1번 사람 감정 흔들림/안정)
※ [2번일지충] 달: score -7점 / [2번일지합] 달: score +5점 (2번 사람 감정 흔들림/안정)
※ 두 사람 모두 일지충인 달: score 추가 -5점 적용 (가장 어려운 달)

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
