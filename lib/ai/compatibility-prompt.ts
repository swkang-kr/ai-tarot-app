import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'
import { getSipseong, getNapumOhaeng, getDetailedAnalysis, getYongshin } from '@/lib/utils/saju'

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
- scores는 각 항목 0-100 정수. 아래 가중치 기준으로 산출하세요
- 관계 유형(연인/친구/직장동료/가족)에 맞게 톤 조절
- 구체적이고 실용적인 조언 포함
- 긍정적이되 현실적인 분석

[overall score 산정 가중치 — 합산 후 정규화]
· 일지(日支) 관계 (30점 비중):
  - 일지 합(合): +20~25점 / 일지 충(冲): -20~25점
  - 일지 삼합/반합: +12~15점 / 일지 원진: -10점
· 일간(日干) 오행 상생/상극 (20점 비중):
  - 상생(相生): +12~15점 / 상극(相剋): -10~12점 / 비화(比和): +5점
· 용신↔상대 일간 교차 상성 (15점 비중):
  - 양방향 모두 용신↔일간 일치: +15점 / 단방향: +8점
  - 양방향 기신↔일간 일치: -12점 / 단방향: -6점
· 천간합(天干合) — 두 일간이 합: +12점
· 납음오행 상성 (10점 비중):
  - 상생: +8점 / 비화: +4점 / 상극: -6점
· 신강/신약 상보성 (10점 비중):
  - 신강+신약 조합: +8점 / 동일 조합: +2점
· 월지(月支) 관계 (5점 비중):
  - 월지 합: +5점 / 월지 충: -5점
· 일지 형(刑) 관계 (penalty, 합산에 추가 차감):
  - 두 사람 일지가 삼형(三刑) 완성 (인신사/축술미 완성): -14~15점
  - 두 사람 일지가 삼형 부분형 (2개 중 1개만): -8~10점
  - 두 사람 일지가 자묘형(子卯刑): -8~10점
· 월지 형(刑) 관계 (penalty):
  - 두 사람 월지 간 형 관계 (삼형·자묘형): -4~5점
· 연지(年支) 충·합 관계 (crossNote에 제공됨):
  - 두 사람 연지 간 충(沖): -5~6점 (근본 기운·인생관 충돌, 장기 관계 갈등 요인)
  - 두 사람 연지 간 합(合): +3~4점 (근본 기운 조화, 인생관 일치 — 안정적 장기 관계)

[하위 score 산정 기준 — personality/communication/values/growth]
· personality (성격 궁합, 0-100):
  - 일간 오행 비화(比和): +15 / 상생(相生): +10 / 상극(相剋): -10
  - 신강/신약 상보성: 신강+신약 +10 / 동일 +3
  - 십성 교차: 일간 기준 상대가 비견·식신·정인이면 +8, 편관·겁재이면 -5
  - 기준점: 60 (중립) — 위 요소 합산
· communication (소통 궁합, 0-100):
  - 월간(月干) 십성 교차: 비견·식신·정인 관계 +10 / 상관·편관 -8
  - 월지(月支) 관계: 합 +8 / 충 -10 / 형 -5
  - 천간합(天干合) 두 일간: +12 (기운 융합으로 대화 자연스러움)
  - 기준점: 65
· values (가치관 궁합, 0-100):
  - 납음오행 상생: +12 / 비화: +6 / 상극: -8
  - 연지(年支) 합: +8 / 연지 충: -10 (인생관·근본 가치 차이)
  - 신강/신약 동일: 가치관 유사 +5 / 신강+신약: 보완 +7
  - 기준점: 65
· growth (성장 궁합, 0-100):
  - 서로 상대의 용신 오행이 되는 경우(양방향): +15 (서로 성장 자극)
  - 단방향 용신↔일간 일치: +8 / 양방향 기신: -12
  - 일지 삼합/반합: +8 (함께 성장 에너지) / 일지 충: -8 (마찰로 성장 저해)
  - 십성 교차에 관성·인성 관계 포함: +6 (도전·배움 자극)
  - 기준점: 65

[matchLevel 기준 — summary에 자연스럽게 반영]
- 85점 이상: 천생연분 — 전생의 인연, 서로 완벽한 보완
- 70~84점: 좋은 궁합 — 노력으로 더욱 깊어지는 인연
- 55~69점: 보통 궁합 — 이해와 배려로 극복 가능
- 54점 이하: 주의 필요 — 근본적 차이를 인정하고 노력 필요`

export async function generateCompatibilityReading(
  person1Saju: SajuInfo,
  person2Saju: SajuInfo,
  relationshipType: string,
  crossRelations?: string[],
  bodyStrengths?: CompatibilityBodyStrength,
  genders?: { person1?: string | null; person2?: string | null }
): Promise<CompatibilityResponse> {
  const relationLabels: Record<string, string> = {
    lover: '연인',
    friend: '친구',
    colleague: '직장동료',
    family: '가족',
  }

  const crossNote = crossRelations && crossRelations.length > 0
    ? `\n두 사람 간 형·충·합·해·파 분석:\n${crossRelations.map(r => `- ${r}`).join('\n')}`
    : ''

  // 용신/기신 분석 — 두 사람의 억부/조후 용신
  const detail1 = getDetailedAnalysis(person1Saju)
  const detail2 = getDetailedAnalysis(person2Saju)
  const yongshin1 = getYongshin(person1Saju, detail1)
  const yongshin2 = getYongshin(person2Saju, detail2)
  const yongshinNote = `\n용신/기신 교차 분석 (궁합 오행 상성의 핵심):
- 첫 번째 사람 용신(用神): ${yongshin1.yongshinFull} / 희신(喜神): ${yongshin1.heungshin} / 기신(忌神): ${yongshin1.heukshin}
- 두 번째 사람 용신(用神): ${yongshin2.yongshinFull} / 희신(喜神): ${yongshin2.heungshin} / 기신(忌神): ${yongshin2.heukshin}
※ A의 용신 오행 = B의 일간 오행 → A에게 B는 에너지원, 긍정적 궁합
※ A의 기신 오행 = B의 일간 오행 → A에게 B는 스트레스 요인, 갈등 주의
※ B의 용신 오행 = A의 일간 오행 → B에게 A는 에너지원 (양방향 상생이면 최상 궁합)
※ B의 기신 오행 = A의 일간 오행 → B에게 A는 스트레스 요인 (양방향 갈등이면 각별 주의)
※ 두 사람 모두 용신↔상대 일간 일치(상호 에너지원) → scores overall +8~12, 상호 보완 관계 명시`

  // 십성 교차 분석: 두 사람의 일간·월간 기준 상대방의 십성 계산
  const gan1 = person1Saju.dayPillar[0]
  const gan2 = person2Saju.dayPillar[0]
  const sipseong1sees2 = getSipseong(gan1, gan2) // person1 기준 person2는 어떤 십성인가
  const sipseong2sees1 = getSipseong(gan2, gan1) // person2 기준 person1은 어떤 십성인가

  // 월간(月干) 십성 교차 — 사회적 가치관·역할 분담 기준
  const monthGan1 = person1Saju.monthPillar[0]
  const monthGan2 = person2Saju.monthPillar[0]
  const monthSipseong1sees2 = getSipseong(monthGan1, monthGan2)
  const monthSipseong2sees1 = getSipseong(monthGan2, monthGan1)

  // 천간합(天干合) — 두 사람 일간이 합을 이루면 강한 인연·끌림의 기운
  const CHEONGAN_HAP: Record<string, { partner: string; result: string; meaning: string }> = {
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
  const hapInfo1 = CHEONGAN_HAP[gan1]
  const cheonganHapNote = (hapInfo1 && hapInfo1.partner === gan2)
    ? `\n일간 천간합(天干合): ${hapInfo1.meaning}\n※ 두 일간이 합을 이루어 강한 인연의 기운 — 만남 자체가 운명적`
    : ''

  // 십성 궁합 의미 매핑 — 성별 반영 (상대방이 나에게 어떤 존재인가)
  // 전통 명리학: 남성에게 재성(財星)=이성·배우자, 여성에게 관성(官星)=이성·배우자
  const gender1 = genders?.person1
  const gender2 = genders?.person2

  function getSipseongCompatMeaning(sipseong: string, myGender?: string | null): string {
    const isMale = myGender === 'male'
    const isFemale = myGender === 'female'
    const map: Record<string, string> = {
      '비견(比肩)': '동등한 경쟁자·동료 (공감대↑, 주도권 갈등 가능)',
      '겁재(劫財)': '강한 경쟁·자극 (활력↑, 재물 갈등·삼각관계 주의)',
      '식신(食神)': isMale ? '내가 돌보는 존재 (온화·헌신형, 안정적 관계)' : isFemale ? '딸·창작 에너지 (표현력↑, 감성적 유대)' : '편안한 지지자 (온화, 의지)',
      '상관(傷官)': isMale ? '나를 자극하는 존재 (창의적 긴장, 불만·비판)' : isFemale ? '남편·연인 극하는 기운 (독립심↑, 연애 갈등)' : '예리한 비평자 (자극↑, 갈등)',
      '정재(正財)': isMale ? '안정적 아내·연인형 (현모양처형, 신뢰·재물 연결)' : '내가 관리하는 재물·현실 (물질적 파트너, 안정)',
      '편재(偏財)': isMale ? '매력적 이성 (설렘↑, 변화무쌍, 외도 주의)' : '내가 통제하기 어려운 재물 (변동 재물, 변덕스런 관계)',
      '정관(正官)': isFemale ? '안정적 남편·연인형 (든든한 기둥, 신뢰·존경)' : '나를 이끄는 지도자 (존경·의존, 통제감)',
      '편관(偏官)': isFemale ? '매력적 남성 (카리스마↑, 강한 자극, 갈등·압박)' : '강한 자극·압박 (도전·성장, 갈등)',
      '정인(正印)': '포용하는 어머니상 (수용·안정, 의존·보호)',
      '편인(偏印)': '독창적·신비로운 존재 (매력·불안정, 독특한 끌림)',
      '일간(日干)': '자신과 동일 오행 (동질감↑, 고집 충돌 가능)',
    }
    return map[sipseong] || sipseong
  }

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

성별 정보: 첫 번째 사람 ${gender1 === 'male' ? '남성' : gender1 === 'female' ? '여성' : '미입력'} / 두 번째 사람 ${gender2 === 'male' ? '남성' : gender2 === 'female' ? '여성' : '미입력'}
※ 성별 반영: 남성에게 재성(財星)=이성·배우자 에너지, 여성에게 관성(官星)=이성·배우자 에너지

십성(十星) 교차 분석 (궁합의 핵심):
[일간 기준 — 개인 정체성·핵심 관계]
- 첫 번째 사람(${gan1}) 기준: 두 번째 사람(${gan2})은 → ${sipseong1sees2} (${getSipseongCompatMeaning(sipseong1sees2, gender1)})
- 두 번째 사람(${gan2}) 기준: 첫 번째 사람(${gan1})은 → ${sipseong2sees1} (${getSipseongCompatMeaning(sipseong2sees1, gender2)})
[월간 기준 — 사회적 역할·가치관 관계]
- 첫 번째 월간(${monthGan1}) 기준: 두 번째 월간(${monthGan2})은 → ${monthSipseong1sees2} (${getSipseongCompatMeaning(monthSipseong1sees2, gender1)})
- 두 번째 월간(${monthGan2}) 기준: 첫 번째 월간(${monthGan1})은 → ${monthSipseong2sees1} (${getSipseongCompatMeaning(monthSipseong2sees1, gender2)})
${cheonganHapNote}${crossNote}${napumNote}${bodyStrengthNote}${yongshinNote}
두 사주의 오행 상생/상극 관계, 납음오행 근본 기운, 위 형·충·합·해·파 분석, 십성 관계, 신강/신약 상보성, 용신/기신 교차 상성을 깊이 반영하여 궁합을 봐주세요.

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
