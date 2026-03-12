import { anthropic } from '@/lib/ai/client'
import type { SajuInfo, SajuDetailedAnalysis } from '@/lib/utils/saju'
import { calculateDaeunStartAge, calculateDaeunPillars, getNapumOhaeng, getYongshin } from '@/lib/utils/saju'

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
    { "period": "대운 1기 (나이 범위)", "theme": "이 대운의 핵심 테마", "description": "이 시기의 운 흐름 (60-80자)", "rating": 3 },
    { "period": "대운 2기 (나이 범위)", "theme": "이 대운의 핵심 테마", "description": "이 시기의 운 흐름 (60-80자)", "rating": 4 },
    { "period": "대운 3기 (나이 범위)", "theme": "이 대운의 핵심 테마", "description": "이 시기의 운 흐름 (60-80자)", "rating": 5 },
    { "period": "대운 4기 (나이 범위)", "theme": "이 대운의 핵심 테마", "description": "이 시기의 운 흐름 (60-80자)", "rating": 4 },
    { "period": "대운 5기 (나이 범위)", "theme": "이 대운의 핵심 테마", "description": "이 시기의 운 흐름 (60-80자)", "rating": 3 }
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
  detail: SajuDetailedAnalysis,
  gender?: string | null
): Promise<DeepSajuResponse> {
  const genderNote = gender === 'male' ? '남성 (대운 순행 가능성)' : gender === 'female' ? '여성 (대운 역행 가능성)' : '성별 미입력'

  // 대운 시작 나이 & 현재 대운 구간 계산
  const birthYearGan = saju.yearPillar[0]
  const isYangYear = ['갑', '병', '무', '경', '임'].includes(birthYearGan)
  let daeunDirection = '불명확'
  if (gender === 'male') daeunDirection = isYangYear ? '순행(順行)' : '역행(逆行)'
  else if (gender === 'female') daeunDirection = isYangYear ? '역행(逆行)' : '순행(順行)'
  const daeunStart = calculateDaeunStartAge(birthDate, birthYearGan, gender)
  const currentYear = new Date().getFullYear()
  const birthYear = parseInt(birthDate.split('-')[0])
  const currentAge = currentYear - birthYear + 1 // 세는나이

  // 실제 대운 천간지지 계산
  const daeunDir = daeunDirection.includes('순행') ? 'forward' : 'reverse'
  const daeunPillars = calculateDaeunPillars(saju.monthPillar, daeunDir, daeunStart, 8)

  const specialRelationsStr = detail.specialRelations && detail.specialRelations.length > 0
    ? detail.specialRelations.map(r => `- ${r.type}: ${r.chars.join('')} → ${r.meaning}`).join('\n')
    : '- 특이 관계 없음'
  const dayNapum = getNapumOhaeng(saju.dayPillar)
  const yongshin = getYongshin(saju, detail)

  const userPrompt = `${birthDate}생 사용자의 사주팔자를 심층 분석해주세요.

대운(大運) 기본 정보:
- 성별: ${genderNote}
- 대운 방향: ${daeunDirection}
- 대운 시작 나이: ${daeunStart}세 (절기 기준 정밀 계산값)
- 현재 나이: ${currentAge}세 (세는나이)
- 실제 대운 간지 목록:
${daeunPillars.map(d => `  · ${d.age}세 대운: ${d.pillar}(${d.hanja})`).join('\n')}
- fortuneCycles period는 위 대운 간지를 포함하여 "${daeunStart}세 ${daeunPillars[0]?.hanja || ''}대운" 형식으로 표기하세요.

사주 원국:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

성별: ${genderNote}

일간 분석:
- 일간: ${detail.dayMaster.name} (${detail.dayMaster.element})
- 신강/신약: ${detail.bodyStrength}
- 격국(格局): ${detail.geokguk}
- 성향: ${detail.dayMaster.trait}
- 설명: ${detail.dayMaster.description}

오행 균형 (지장간 포함):
${detail.elementBalanceWithJijanggan.map((e) => `- ${e.name}: ${e.count}개 ${e.emoji}`).join('\n')}
- 강한 오행: ${detail.dominantElement}
- 약한 오행: ${detail.weakElement}

각 주 분석 (십성·십이운성 포함):
${detail.pillarsDetail.map((p) => `- ${p.label}: ${p.hangul ?? '없음'} → 십성(${p.sipseong || '일간'}), 십이운성(${p.sipiunsung || '없음'}), 천간(${p.cheonganMeaning}), 지지(${p.jijiMeaning})`).join('\n')}

오행 관계: ${detail.relationships.join(', ')}

삼합·반합·형·충·합·해·파 특수 관계:
${specialRelationsStr}

신살(神煞): ${detail.sinsal && detail.sinsal.length > 0 ? detail.sinsal.map(s => `${s.name}(${s.pillars.join('·')})`).join(', ') : '없음'}
공망(空亡): ${detail.gongmang ? `${detail.gongmang[0]}·${detail.gongmang[1]}` : '없음'}${detail.gongmangPillars && detail.gongmangPillars.length > 0 ? `\n공망 위치 해석:\n${detail.gongmangPillars.map(g => `- ${g.label}(${g.ji}) 공망: ${g.meaning}`).join('\n')}` : ''}
납음오행(일주): ${dayNapum.name}(${dayNapum.element}오행) — 일간 부차 오행, 성격과 운명의 부가적 색채

[용신(用神) 코드 계산값 — 반드시 사용]
- 용신(用神): ${yongshin.yongshinFull}
- 기신(忌神): ${yongshin.heukshin}
- 구신(仇神): ${yongshin.boekshin}
- 용신 근거: ${yongshin.reason}

위 사주 정보(성별·신강신약·격국·지장간·십성·십이운성·신살·공망·특수관계 포함)를 바탕으로 이 사람의 삶의 패턴, 성향, 운명적 흐름을 심층 분석해주세요.
대운 순행/역행 판단 시 성별을 반드시 반영하세요.
격국과 십성 구성으로 드러나는 재성·관성·인성의 강약을 재물·직업·학습 패턴과 연결하여 분석하세요.
십이운성에서 제왕·임관은 강한 발전기, 묘·절·병·사는 주의 시기로 해석하세요.
yongshin 필드에 위 용신 계산값을 바탕으로 실생활 활용법(색상·방위·음식·직업)을 제시해주세요.`

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
