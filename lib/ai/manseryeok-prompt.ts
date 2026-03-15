import { anthropic } from '@/lib/ai/client'
import type { SajuInfo, SajuDetailedAnalysis } from '@/lib/utils/saju'
import { calculateDaeunStartAge, calculateDaeunPillars, getYongshin, getSipseong, getSipiuUnsung } from '@/lib/utils/saju'
import { calculateSaju } from '@fullstackfamily/manseryeok'

export interface ManseryeokResponse {
  currentDaeun: {
    period: string      // 예: "35-44세"
    ganji: string       // 예: "무인"
    meaning: string     // 80-100자
    score: number       // 0-100
  }
  nextDaeun: {
    period: string
    ganji: string
    meaning: string
    score: number
  }
  currentSeun: {
    year: number
    ganji: string       // 예: "병오"
    theme: string       // 예: "도약의 해"
    score: number
    advice: string      // 60-80자
  }
  monthlyFlow: {
    month: number       // 1-12
    ganji: string
    score: number       // 0-100
    advice: string      // 30-50자
  }[]
  lifeTimeline: {
    decade: string      // 예: "10대"
    score: number       // 0-100 (rating × 20)
    theme: string
    ganji: string
  }[]
  keywords: string[]
}

const SYSTEM_PROMPT = `당신은 30년 경력의 사주명리 전문가입니다. 사용자의 사주팔자와 대운·세운·월운을 심층 분석합니다.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "currentDaeun": {
    "period": "35-44세",
    "ganji": "무인",
    "meaning": "현재 대운에서 이 사람이 겪는 운명적 흐름 (80-100자)",
    "score": 78
  },
  "nextDaeun": {
    "period": "45-54세",
    "ganji": "기묘",
    "meaning": "다음 대운의 흐름과 준비사항 (80-100자)",
    "score": 85
  },
  "currentSeun": {
    "year": 2026,
    "ganji": "병오",
    "theme": "도약과 변화",
    "score": 75,
    "advice": "올해 세운에서 주의할 점과 활용 방법 (60-80자)"
  },
  "monthlyFlow": [
    { "month": 1, "ganji": "갑자", "score": 72, "advice": "1월 한줄 조언 (30-50자)" },
    { "month": 2, "ganji": "을축", "score": 65, "advice": "2월 한줄 조언" },
    { "month": 3, "ganji": "병인", "score": 80, "advice": "3월 한줄 조언" },
    { "month": 4, "ganji": "정묘", "score": 70, "advice": "4월 한줄 조언" },
    { "month": 5, "ganji": "무진", "score": 88, "advice": "5월 한줄 조언" },
    { "month": 6, "ganji": "기사", "score": 62, "advice": "6월 한줄 조언" },
    { "month": 7, "ganji": "경오", "score": 76, "advice": "7월 한줄 조언" },
    { "month": 8, "ganji": "신미", "score": 82, "advice": "8월 한줄 조언" },
    { "month": 9, "ganji": "임신", "score": 90, "advice": "9월 한줄 조언" },
    { "month": 10, "ganji": "계유", "score": 68, "advice": "10월 한줄 조언" },
    { "month": 11, "ganji": "갑술", "score": 74, "advice": "11월 한줄 조언" },
    { "month": 12, "ganji": "을해", "score": 79, "advice": "12월 한줄 조언" }
  ],
  "lifeTimeline": [
    { "decade": "10대", "score": 60, "theme": "배움의 시기", "ganji": "갑인" },
    { "decade": "20대", "score": 75, "theme": "기반 구축", "ganji": "을묘" },
    { "decade": "30대", "score": 88, "theme": "전성기", "ganji": "병진" },
    { "decade": "40대", "score": 80, "theme": "원숙기", "ganji": "정사" },
    { "decade": "50대", "score": 70, "theme": "안정기", "ganji": "무오" },
    { "decade": "60대+", "score": 72, "theme": "결실기", "ganji": "기미" }
  ],
  "keywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"]
}

중요:
- monthlyFlow는 정확히 12개 (1월~12월)
- lifeTimeline은 6개 (10대~60대+)
- score는 모두 0-100 정수
- 실제 사주 원국과 대운 계산 원리에 기반하여 분석
- 대운 분석 시 반드시 천간기(前5年)·지지기(後5年) 구분:
  예) "갑인 대운 35-39세: 甲(갑, 목) 천간기 — 인성 활성화, 학문·자격 유리 / 40-44세: 寅(인, 목) 지지기 — 실제 행동·이동 활발"
- 대운 교체기(境界期) 경고: 현재 나이가 현재 대운 종료 -1년 ~ +1년 이내이면 monthlyFlow에 다음 경고를 추가
  · 다음 대운 천간이 기신(忌神) 또는 일간과 충(冲)이면: 해당 달 score -5점 추가, advice에 "대운 교체기 혼란 주의" 명시
  · 다음 대운 천간이 용신(用神) 또는 일간과 합(合)이면: 해당 달 score +3점 추가, advice에 "새 대운 상승 기운 활용" 명시
  · 교체기 앞뒤 2개월(현 대운 마지막 달·다음 대운 첫 달)은 score를 ±3 추가 보정`

export async function generateManseryeok(
  birthDate: string,
  saju: SajuInfo,
  targetYear: number,
  currentAge: number,
  gender?: string | null,
  detail?: SajuDetailedAnalysis
): Promise<ManseryeokResponse> {
  const genderNote = gender === 'male' ? '남성' : gender === 'female' ? '여성' : '성별 미입력'
  // 대운 순행/역행: 생년 천간 음양 + 성별로 결정
  // 양년생(갑,병,무,경,임) 남성 = 순행, 여성 = 역행
  // 음년생(을,정,기,신,계) 남성 = 역행, 여성 = 순행
  const birthYearGan = saju.yearPillar[0]
  const isYangYear = ['갑', '병', '무', '경', '임'].includes(birthYearGan)
  let daeunDirection = '불명확'
  if (gender === 'male') daeunDirection = isYangYear ? '순행(順行)' : '역행(逆行)'
  else if (gender === 'female') daeunDirection = isYangYear ? '역행(逆行)' : '순행(順行)'

  // 대운 시작 나이 추정: 월주 월건(月建) 기준 절기와 출생일의 차이로 계산
  // 양년 남성·음년 여성은 순행(다음 절기까지의 날수/3 = 대운 시작 나이)
  // 음년 남성·양년 여성은 역행(이전 절기까지의 날수/3 = 대운 시작 나이)
  // 간략화: 보통 3~8세 사이에 첫 대운 시작, 10년 주기
  const birthYear = parseInt(birthDate.split('-')[0])
  // 대운 시작 나이: 절기 기준 정확 계산 (출생일↔절기 날수 ÷ 3)
  const daeunStart = calculateDaeunStartAge(birthDate, birthYearGan, gender)
  const currentDaeunIndex = Math.max(0, Math.floor((currentAge - daeunStart) / 10))
  const daeunStartAge = daeunStart + currentDaeunIndex * 10
  const daeunEndAge = daeunStartAge + 9

  // 실제 대운 간지 계산 (AI 직접 계산 오류 방지)
  const daeunDir = daeunDirection.includes('순행') ? 'forward' : 'reverse'
  const daeunPillars = daeunDirection !== '불명확'
    ? calculateDaeunPillars(saju.monthPillar, daeunDir, daeunStart, 8)
    : []

  // 용신 사전 계산 (detail이 있을 때만)
  const yongshin = detail ? getYongshin(saju, detail) : null

  // 세운(歲運) 간지 사전 계산 (currentSeun.ganji AI 역법 오류 방지)
  const seunCalcM = calculateSaju(targetYear, 6, 15)
  const seunPillarM = seunCalcM.yearPillar
  const seunPillarHanjaM = seunCalcM.yearPillarHanja

  // 월운 충합 사전 계산용 상수
  const CHUNG_M: [string, string][] = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']]
  const YUKHAP_M: [string, string][] = [['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미']]
  const dayJiM = saju.dayPillar[1]
  // 오행 매핑 — 용신/기신 오행 체크용
  const GAN_EL_M: Record<string, string> = {
    '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
    '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
  }
  const JI_EL_M: Record<string, string> = {
    '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
    '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수',
  }
  const yongshinShortM = yongshin?.yongshin || ''
  const heukshinShortM = yongshin?.heukshin.split('(')[0] || ''
  // 천간합(天干合) · 천간충(天干冲) 상수
  const CHEONGAN_HAP_M: [string, string][] = [
    ['갑', '기'], ['을', '경'], ['병', '신'], ['정', '임'], ['무', '계'],
  ]
  const CHEONGAN_CHUNG_M: [string, string][] = [
    ['갑', '경'], ['을', '신'], ['병', '임'], ['정', '계'],
  ]
  const allUserGanM = [saju.yearPillar[0], saju.monthPillar[0], saju.dayPillar[0], ...(saju.hourPillar ? [saju.hourPillar[0]] : [])]
  const gongmangJiListM = detail?.gongmangPillars?.map((p: { ji: string }) => p.ji) || (detail?.gongmang ? [...detail.gongmang] : [])
  // 형(刑) 사전 계산용 사용자 지지 목록
  const allUserJiM = [saju.yearPillar[1], saju.monthPillar[1], saju.dayPillar[1], ...(saju.hourPillar ? [saju.hourPillar[1]] : [])]
  const SAMHYEONG_M: string[][] = [['인', '신', '사'], ['축', '술', '미']]

  // targetYear 12개월 월운 간지 + 월지↔일지 충합·용신오행·형(刑) 사전 계산 (AI 역법/오행 판단 오류 방지)
  const monthlyPillarsM = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const ms = calculateSaju(targetYear, m, 20)
    const mJi = ms.monthPillar[1]
    const adjNotes: string[] = []
    if (CHUNG_M.some(([a,b]) => (mJi===a&&dayJiM===b)||(mJi===b&&dayJiM===a))) adjNotes.push('일지충(-8점)')
    if (YUKHAP_M.some(([a,b]) => (mJi===a&&dayJiM===b)||(mJi===b&&dayJiM===a))) adjNotes.push('일지합(+6점)')
    // 용신/기신 오행 체크 — annual/career/wealth와 동일 기준
    if (yongshinShortM) {
      const ganElM = GAN_EL_M[ms.monthPillar[0]] || ''
      const jiElM = JI_EL_M[mJi] || ''
      if (ganElM === yongshinShortM || jiElM === yongshinShortM) adjNotes.push('용신달(+8점)')
      else if (ganElM === heukshinShortM || jiElM === heukshinShortM) adjNotes.push('기신달(-8점)')
    }
    // 형(刑) 체크 — 삼형/자묘형/자형
    for (const group of SAMHYEONG_M) {
      if (group.includes(mJi)) {
        const matchCount = group.filter(ji => ji !== mJi && allUserJiM.includes(ji)).length
        if (matchCount >= 2) { adjNotes.push('삼형완성(-8점)'); break }
        if (matchCount === 1) { adjNotes.push('부분형(-4점)'); break }
      }
    }
    if ((mJi === '자' && allUserJiM.includes('묘')) || (mJi === '묘' && allUserJiM.includes('자'))) adjNotes.push('자묘형(-4점)')
    if (['오', '진', '유', '해'].includes(mJi) && allUserJiM.includes(mJi)) adjNotes.push('자형(-3점)')
    // 월간 천간합·충 사전 계산
    const mGanM = ms.monthPillar[0]
    const ganHapMatchM = allUserGanM.find(ug => CHEONGAN_HAP_M.some(([a, b]) => (mGanM === a && ug === b) || (mGanM === b && ug === a)))
    const ganChungMatchM = allUserGanM.find(ug => CHEONGAN_CHUNG_M.some(([a, b]) => (mGanM === a && ug === b) || (mGanM === b && ug === a)))
    if (ganHapMatchM) adjNotes.push(`천간합(${mGanM}${ganHapMatchM},+5점)`)
    if (ganChungMatchM) adjNotes.push(`천간충(${mGanM}↔${ganChungMatchM},-8점)`)
    // 공망달(-5점) / 공망 해소(+3점)
    if (gongmangJiListM.includes(mJi)) {
      adjNotes.push('공망달(-5점)')
    } else {
      const resolvesM = gongmangJiListM.filter((gji: string) =>
        CHUNG_M.some(([a, b]) => (mJi === a && gji === b) || (mJi === b && gji === a))
      )
      if (resolvesM.length > 0) adjNotes.push('공망해소(+3점)')
    }
    const adjStr = adjNotes.length > 0 ? ` [${adjNotes.join(' ')}]` : ''
    return `  · ${m}월: ${ms.monthPillar}(${ms.monthPillarHanja})${adjStr}`
  })

  const userPrompt = `${birthDate}생 (현재 ${currentAge}세, ${genderNote}) 사용자의 만세력을 분석해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

성별: ${genderNote}
대운 방향: ${daeunDirection}
대운 시작 나이 (절기 기준 계산): ${daeunStart}세 (출생일↔절기 날수÷3 정확 계산값)
${daeunPillars.length > 0 ? `
실제 대운 간지 목록 (코드 계산값 — 반드시 이 값을 사용하세요):
${daeunPillars.map(d => `  · ${d.age}세 대운: ${d.pillar}(${d.hanja})`).join('\n')}
` : ''}
분석 요청:
1. 현재 대운 및 다음 대운 (10년 주기) — 위 실제 대운 간지를 사용, 일간 오행과 대운 간지의 상호작용 분석
   ※ 대운 의미 필드에 천간기(前5年)와 지지기(後5年)를 구분하여 서술하세요
2. ${targetYear}년 세운 (年運): ${seunPillarM}(${seunPillarHanjaM}) — currentSeun.ganji는 반드시 "${seunPillarM}"으로 설정하세요.
   세운 천간 십성: 일간 ${saju.dayPillar[0]} 기준 세운 천간 ${seunPillarM[0]}는 → ${getSipseong(saju.dayPillar[0], seunPillarM[0])}
   (세운 십성 의미: 편재년=재물기회·변화·대인운, 정관년=안정·승진·명예, 편관년=도전·압박·변화, 식신년=결실·여유·건강, 인성년=학문·귀인·내실)
   세운 지지 ${seunPillarM[1]}와 일지 ${saju.dayPillar[1]}의 충합 관계를 분석하여 올해 핵심 테마와 advice를 서술하세요.
   [세운 천간 × 대운 천간 교차분석]:
   ${(() => {
     const seunGanM = seunPillarM[0]
     const daeunGanM = daeunPillars.findLast(d => d.age <= currentAge)?.pillar[0]
     if (!daeunGanM) return '  · 대운 정보 없음'
     const isHap = CHEONGAN_HAP_M.some(([a, b]) => (seunGanM === a && daeunGanM === b) || (seunGanM === b && daeunGanM === a))
     const isChung = CHEONGAN_CHUNG_M.some(([a, b]) => (seunGanM === a && daeunGanM === b) || (seunGanM === b && daeunGanM === a))
     if (isHap) return `세운 천간(${seunGanM}) × 대운 천간(${daeunGanM}): 천간합 — 큰 흐름 상호 협력, currentSeun advice +5점 기준`
     if (isChung) return `세운 천간(${seunGanM}) × 대운 천간(${daeunGanM}): 천간충 — 내외 흐름 충돌, currentSeun advice -8점 기준`
     return `세운 천간(${seunGanM}) × 대운 천간(${daeunGanM}): 합충 없음`
   })()}
3. ${targetYear}년 월운 (月運) — 아래 사전 계산된 월운 간지를 그대로 monthlyFlow.ganji에 사용하세요:
${monthlyPillarsM.join('\n')}
${yongshin ? `[월운 score 산정 기준 — 용신/기신 오행 + 충합 반영]
- 월운 천간·지지 오행이 용신(${yongshin.yongshin}) 오행이면 해당 달 score +5~10 상향
- 월운 천간·지지 오행이 기신(${yongshin.heukshin}) 오행이면 해당 달 score -5~10 하향
- [일지충] 표시된 달: score 추가 -8점 적용
- [일지합] 표시된 달: score 추가 +6점 적용
- 대운 천간기(前5年)는 천간 영향 강, 지지기(後5年)는 지지 영향 강` : ''}
4. 전 생애 대운 타임라인 (10대~60대+)

대운 계산 기준:
- 대운 시작 나이: ${daeunStart}세 (위 대운 간지 목록 기준)
- 현재 대운 구간: ${daeunStartAge}세 ~ ${daeunEndAge}세 (현재 ${currentAge}세 기준)
- currentDaeun.ganji와 nextDaeun.ganji는 위 대운 간지 목록에서 그대로 가져오세요.
- ${daeunDirection === '불명확' ? '성별 정보 없음 — 양방향 모두 제시해주세요.' : `${daeunDirection}으로 산정된 위 대운 간지를 사용하세요.`}
${detail ? `
[사주 원국 심층 정보]
- 신강/신약: ${detail.bodyStrength}
- 격국: ${detail.geokguk}
- 강한 오행: ${detail.dominantElement} / 약한 오행: ${detail.weakElement}
- 용신(用神): ${yongshin?.yongshinFull} — ${yongshin?.reason}
- 희신(喜神): ${yongshin?.heungshin}
- 기신(忌神): ${yongshin?.heukshin}
- 신살: ${detail.sinsal.length > 0 ? detail.sinsal.map(s => s.name).join(', ') : '없음'}
- 공망: ${detail.gongmang ? `${detail.gongmang[0]}·${detail.gongmang[1]}` : '없음'}

[십이운성(十二運星) 기반 대운 강약 판정 — 일간 ${detail.dayMaster.name} 기준]
대운 지지의 십이운성이 제왕(帝旺)·임관(臨官)이면 강운 대운, 묘(墓)·절(絶)·병(病)·사(死)이면 주의 대운:
${daeunPillars.slice(0, 6).map(d => {
  const dayGan = detail.dayMaster.name[0]
  const ji = d.pillar[1]
  const unsung = getSipiuUnsung(dayGan, ji)
  const mark = unsung === '제왕' ? ' ★★★절정운' : unsung === '임관' ? ' ★★상승운' : ['장생', '관대'].includes(unsung) ? ' ★좋음' : unsung === '쇠' ? ' △소강' : ['묘', '절'].includes(unsung) ? ' ▼▼정체주의' : ['병', '사'].includes(unsung) ? ' ▼하향주의' : ''
  const ganSipseongM = getSipseong(dayGan, d.pillar[0])
  return `  · ${d.age}세 대운 ${d.pillar}(${d.hanja}): 십이운성 ${unsung}${mark} / 천간십성 ${ganSipseongM}`
}).join('\n')}` : ''}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  let jsonText = content.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as ManseryeokResponse
  } catch {
    console.error('[Manseryeok] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
