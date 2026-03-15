import { anthropic } from '@/lib/ai/client'
import { calculateSaju } from '@fullstackfamily/manseryeok'
import type { SajuInfo, SajuDetailedAnalysis } from '@/lib/utils/saju'
import { calculateDaeunStartAge, calculateDaeunPillars, getNapumOhaeng, getYongshin, getSipseong, getSamjae, getYearJi } from '@/lib/utils/saju'

const GAN_HANJA_DS: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
}
const JI_HANJA_DS: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
}

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
- 구체적이고 실용적인 통찰 제공

[yongshin 필드 — 용신 오행별 실생활 활용법 기준]
yongshin 필드에 용신 오행에 맞는 색상·방위·음식·직업을 반드시 아래 기준으로 제시하세요:
- 목(木) 용신 → 색상: 청색·녹색, 방위: 동쪽, 음식: 신맛(식초·레몬·풋채소·새싹), 직업: 교육·의료·환경·목재
- 화(火) 용신 → 색상: 적색·주황, 방위: 남쪽, 음식: 쓴맛(쑥·커피·녹차·씀바귀), 직업: IT·미디어·엔터·조명
- 토(土) 용신 → 색상: 황색·갈색, 방위: 중앙·북동·남서, 음식: 단맛(고구마·꿀·잡곡·단호박), 직업: 부동산·건설·농업·중개
- 금(金) 용신 → 색상: 백색·금색·회색, 방위: 서쪽, 음식: 매운맛(마늘·고추·생강·양파), 직업: 법률·금융·제조·IT하드웨어
- 수(水) 용신 → 색상: 흑색·남색·군청, 방위: 북쪽, 음식: 짠맛(해산물·된장·미역국·소금), 직업: 유통·물류·무역·예술`

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

  // 현재 연도 세운(歲運) 간지 사전 계산 (thisYearAdvice AI 역법 오류 방지)
  const seunCalc = calculateSaju(currentYear, 6, 15)
  const seunGan = seunCalc.yearPillar[0]
  const seunJi = seunCalc.yearPillar[1]
  const seunPillar = `${seunCalc.yearPillar}(${GAN_HANJA_DS[seunGan] || ''}${JI_HANJA_DS[seunJi] || ''})`

  // 세운 지지↔사주 지지 충합 사전 계산
  const CHUNG_DS: [string, string][] = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']]
  const YUKHAP_DS: [string, string][] = [['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미']]
  const dayJiDS = saju.dayPillar[1]
  const yearJiDS = saju.yearPillar[1]
  const monthJiDS = saju.monthPillar[1]
  const seunChungLines: string[] = []
  if (CHUNG_DS.some(([a,b]) => (seunJi===a&&dayJiDS===b)||(seunJi===b&&dayJiDS===a)))
    seunChungLines.push(`세운 지지(${seunJi})↔일지(${dayJiDS}): 충(冲) → thisYearAdvice에 갈등·변화·이동 반영, overallScore -5~8점`)
  if (YUKHAP_DS.some(([a,b]) => (seunJi===a&&dayJiDS===b)||(seunJi===b&&dayJiDS===a)))
    seunChungLines.push(`세운 지지(${seunJi})↔일지(${dayJiDS}): 합(合) → thisYearAdvice에 인연·기회·안정 반영, overallScore +5~8점`)
  if (CHUNG_DS.some(([a,b]) => (seunJi===a&&yearJiDS===b)||(seunJi===b&&yearJiDS===a)))
    seunChungLines.push(`세운 지지(${seunJi})↔년지(${yearJiDS}): 충(冲) → 환경 변화·뿌리 흔들림 반영`)
  if (YUKHAP_DS.some(([a,b]) => (seunJi===a&&yearJiDS===b)||(seunJi===b&&yearJiDS===a)))
    seunChungLines.push(`세운 지지(${seunJi})↔년지(${yearJiDS}): 합(合) → 출발점 기운 강화 반영`)
  if (CHUNG_DS.some(([a,b]) => (seunJi===a&&monthJiDS===b)||(seunJi===b&&monthJiDS===a)))
    seunChungLines.push(`세운 지지(${seunJi})↔월지(${monthJiDS}): 충(冲) → 직업·사회운 변동 반영`)
  if (YUKHAP_DS.some(([a,b]) => (seunJi===a&&monthJiDS===b)||(seunJi===b&&monthJiDS===a)))
    seunChungLines.push(`세운 지지(${seunJi})↔월지(${monthJiDS}): 합(合) → 직업·사회운 활성화 반영`)
  const seunChungNoteDS = seunChungLines.length > 0
    ? `[세운 지지 충합 — 코드 계산값]\n${seunChungLines.map(l => `  · ${l}`).join('\n')}`
    : `[세운 지지 충합 — 코드 계산값]\n  · 세운 지지(${seunJi})와 사주 지지(일지·년지·월지) 간 특별한 충합 없음`

  // 실제 대운 천간지지 계산
  const daeunDir = daeunDirection.includes('순행') ? 'forward' : 'reverse'
  const daeunPillars = calculateDaeunPillars(saju.monthPillar, daeunDir, daeunStart, 8)

  const specialRelationsStr = detail.specialRelations && detail.specialRelations.length > 0
    ? detail.specialRelations.map(r => `- ${r.type}: ${r.chars.join('')} → ${r.meaning}`).join('\n')
    : '- 특이 관계 없음'
  const dayNapum = getNapumOhaeng(saju.dayPillar)
  const yongshin = getYongshin(saju, detail)
  const currentYearJiDS = getYearJi(currentYear)
  const samjaeDS = getSamjae(saju.yearPillar[1], currentYearJiDS)

  const userPrompt = `${birthDate}생 사용자의 사주팔자를 심층 분석해주세요.

대운(大運) 기본 정보:
- 성별: ${genderNote}
- 대운 방향: ${daeunDirection}
- 대운 시작 나이: ${daeunStart}세 (절기 기준 정밀 계산값)
- 현재 나이: ${currentAge}세 (세는나이)
- 실제 대운 간지 목록:
${daeunPillars.map(d => `  · ${d.age}세 대운: ${d.pillar}(${d.hanja}) — 천간기 ${d.age}~${d.age + 4}세(${d.pillar[0]}천간 영향), 지지기 ${d.age + 5}~${d.age + 9}세(${d.pillar[1]}지지 영향)`).join('\n')}
- fortuneCycles period는 위 대운 간지를 포함하여 "${daeunStart}세 ${daeunPillars[0]?.hanja || ''}대운" 형식으로 표기하세요.

[십이운성(十二運星) 기반 대운 강약 — 일간 ${detail.dayMaster.name} 기준, fortuneCycles rating 근거로 반드시 사용]
대운 지지 십이운성이 제왕·임관이면 rating +1~2, 묘·절·병·사이면 rating -1~2 기준:
${(() => {
  const SIPIU_DS: Record<string, Record<string, string>> = {
    '갑': { '해': '장생', '자': '목욕', '축': '관대', '인': '임관', '묘': '제왕', '진': '쇠', '사': '병', '오': '사', '미': '묘', '신': '절', '유': '태', '술': '양' },
    '을': { '오': '장생', '사': '목욕', '진': '관대', '묘': '임관', '인': '제왕', '축': '쇠', '자': '병', '해': '사', '술': '묘', '유': '절', '신': '태', '미': '양' },
    '병': { '인': '장생', '묘': '목욕', '진': '관대', '사': '임관', '오': '제왕', '미': '쇠', '신': '병', '유': '사', '술': '묘', '해': '절', '자': '태', '축': '양' },
    '무': { '인': '장생', '묘': '목욕', '진': '관대', '사': '임관', '오': '제왕', '미': '쇠', '신': '병', '유': '사', '술': '묘', '해': '절', '자': '태', '축': '양' },
    '정': { '유': '장생', '신': '목욕', '미': '관대', '오': '임관', '사': '제왕', '진': '쇠', '묘': '병', '인': '사', '축': '묘', '자': '절', '해': '태', '술': '양' },
    '기': { '유': '장생', '신': '목욕', '미': '관대', '오': '임관', '사': '제왕', '진': '쇠', '묘': '병', '인': '사', '축': '묘', '자': '절', '해': '태', '술': '양' },
    '경': { '사': '장생', '오': '목욕', '미': '관대', '신': '임관', '유': '제왕', '술': '쇠', '해': '병', '자': '사', '축': '묘', '인': '절', '묘': '태', '진': '양' },
    '신': { '자': '장생', '해': '목욕', '술': '관대', '유': '임관', '신': '제왕', '미': '쇠', '오': '병', '사': '사', '진': '묘', '묘': '절', '인': '태', '축': '양' },
    '임': { '신': '장생', '유': '목욕', '술': '관대', '해': '임관', '자': '제왕', '축': '쇠', '인': '병', '묘': '사', '진': '묘', '사': '절', '오': '태', '미': '양' },
    '계': { '묘': '장생', '인': '목욕', '축': '관대', '자': '임관', '해': '제왕', '술': '쇠', '유': '병', '신': '사', '미': '묘', '오': '절', '사': '태', '진': '양' },
  }
  const dayGan = detail.dayMaster.name[0]
  return daeunPillars.slice(0, 6).map(d => {
    const ji = d.pillar[1]
    const unsung = (SIPIU_DS[dayGan] || {})[ji] || '불명'
    const mark = unsung === '제왕' ? ' ★★★절정운(rating+2)' : unsung === '임관' ? ' ★★상승운(rating+1)' : ['장생', '관대'].includes(unsung) ? ' ★호운(rating+0~+1)' : unsung === '쇠' ? ' △소강(중립)' : ['묘', '절'].includes(unsung) ? ' ▼▼정체·주의(rating-2)' : ['병', '사'].includes(unsung) ? ' ▼하향주의(rating-1)' : ''
    return `  · ${d.age}세 대운 ${d.pillar}(${d.hanja}): 십이운성 ${unsung}${mark}`
  }).join('\n')
})()}

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

[${currentYear}년 세운(歲運) 간지 — 코드 계산값, thisYearAdvice에 반드시 사용]
- ${currentYear}년 세운: ${seunPillar}
- 세운 천간 십성: 일간 ${saju.dayPillar[0]} 기준 세운 천간 ${seunGan}는 → ${getSipseong(saju.dayPillar[0], seunGan)}
  (세운 십성 의미를 thisYearAdvice에 반영하세요: 편재년=재물기회·변화, 정관년=안정·승진, 편관년=도전·압박, 식신년=여유·결실)
- 삼재(三災): ${samjaeDS.isSamjae ? `⚠️ ${samjaeDS.type} — ${samjaeDS.description} → thisYearAdvice에 삼재 종류 명시 및 주의사항 강화` : '해당 없음'}
${seunChungNoteDS}

위 사주 정보(성별·신강신약·격국·지장간·십성·십이운성·신살·공망·특수관계 포함)를 바탕으로 이 사람의 삶의 패턴, 성향, 운명적 흐름을 심층 분석해주세요.
대운 순행/역행 판단 시 성별을 반드시 반영하세요.
격국과 십성 구성으로 드러나는 재성·관성·인성의 강약을 재물·직업·학습 패턴과 연결하여 분석하세요.
십이운성에서 제왕·임관은 강한 발전기, 묘·절·병·사는 주의 시기로 해석하세요.

[대운 천간기(前5年)/지지기(後5年) 분석 기준 — fortuneCycles description에 반영]
- 각 대운은 천간 5년(前) + 지지 5년(後)로 나뉩니다
- 천간기(前5년): 대운 천간과 일간의 십성·상생상극 관계 → 사회 활동·외부 운 흐름 결정
  예) 대운 천간이 정관 → 전반 5년 승진·명예 기회 / 대운 천간이 편관 → 전반 5년 도전·갈등
- 지지기(後5년): 대운 지지와 일지의 충합 관계 → 내면 변화·가정·건강 흐름 결정
  예) 대운 지지가 일지와 합(合) → 후반 5년 정서 안정 / 충(冲) → 후반 5년 이동·변화·갈등
- fortuneCycles 각 period 설명에 전반/후반 흐름 차이를 간략히 반영하세요

[일지(日支) 십이운성 — lovePattern 부부운 해석 기준]
- 일지 십이운성은 배우자 인연과 결혼 생활의 핵심 지표입니다
- 일지 장생(長生): 배우자 덕 있음, 결혼 후 성장 / 제왕(帝旺): 배우자 강하나 주도권 갈등
- 일지 목욕(沐浴): 이성 매력 강, 감정 기복 / 관대(冠帶): 사회적 배우자, 체면 중시
- 일지 쇠(衰)·병(病)·사(死): 배우자 건강·활력 주의, 갈등 가능 / 묘(墓): 헌신적이나 답답함
- 일지 절(絶): 인연 변화 많음, 재혼 가능성 / 태(胎)·양(養): 늦은 인연, 성장형 관계
- 위 기준을 lovePattern 해석에 반영하세요

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
