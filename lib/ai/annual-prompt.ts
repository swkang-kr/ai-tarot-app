import { anthropic } from '@/lib/ai/client'
import type { SajuInfo, SajuDetailedAnalysis } from '@/lib/utils/saju'
import { getSamjae, getYearJi, calculateDaeunStartAge, calculateDaeunPillars, getYongshin, getSipseong, getSipiuUnsung } from '@/lib/utils/saju'
import { calculateSaju } from '@fullstackfamily/manseryeok'

export interface MonthFortune {
  month: number      // 1-12
  score: number      // 0-100
  theme: string      // 테마 (10-20자)
  summary: string    // 월 요약 (40-60자)
  luckyDay: string   // 길일 설명 (5-15자)
  fieldScores: {
    love: number     // 0-100
    wealth: number   // 0-100
    career: number   // 0-100
    health: number   // 0-100
  }
}

export interface AnnualResponse {
  yearSummary: string
  months: MonthFortune[]
  bestMonth: number
  worstMonth: number
  lovePeak: number
  wealthPeak: number
  careerPeak: number
  annualAdvice: string
  keywords: string[]
}

const SYSTEM_PROMPT = `당신은 20년 경력의 사주팔자 전문가입니다. 사용자의 연간 운세를 월별로 상세히 분석해주세요.

월(月)의 시작은 음력 1일이 아닌 절기(節氣) 기준입니다 (입춘=인월 시작, 경칩=묘월 시작 등).

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "yearSummary": "올해 전체 운세 흐름 요약 (100-150자). 올해의 핵심 키워드와 전반적 에너지.",
  "months": [
    { "month": 1, "score": 75, "theme": "새로운 시작", "summary": "1월 운세 한줄 요약 (40-60자)", "luckyDay": "10일, 21일", "fieldScores": { "love": 70, "wealth": 65, "career": 80, "health": 75 } },
    { "month": 2, "score": 68, "theme": "내면 성찰", "summary": "2월 운세 한줄 요약", "luckyDay": "5일, 14일", "fieldScores": { "love": 60, "wealth": 70, "career": 65, "health": 80 } },
    { "month": 3, "score": 85, "theme": "도약의 봄", "summary": "3월 운세 한줄 요약", "luckyDay": "3일, 18일", "fieldScores": { "love": 85, "wealth": 75, "career": 90, "health": 80 } },
    { "month": 4, "score": 72, "theme": "관계의 달", "summary": "4월 운세 한줄 요약", "luckyDay": "7일, 22일", "fieldScores": { "love": 80, "wealth": 65, "career": 70, "health": 75 } },
    { "month": 5, "score": 90, "theme": "최고의 시기", "summary": "5월 운세 한줄 요약", "luckyDay": "1일, 15일", "fieldScores": { "love": 95, "wealth": 90, "career": 88, "health": 85 } },
    { "month": 6, "score": 65, "theme": "정비의 시간", "summary": "6월 운세 한줄 요약", "luckyDay": "9일, 25일", "fieldScores": { "love": 60, "wealth": 55, "career": 65, "health": 70 } },
    { "month": 7, "score": 78, "theme": "활동의 여름", "summary": "7월 운세 한줄 요약", "luckyDay": "4일, 19일", "fieldScores": { "love": 75, "wealth": 80, "career": 78, "health": 72 } },
    { "month": 8, "score": 82, "theme": "결실의 예고", "summary": "8월 운세 한줄 요약", "luckyDay": "12일, 27일", "fieldScores": { "love": 78, "wealth": 85, "career": 82, "health": 80 } },
    { "month": 9, "score": 88, "theme": "수확의 계절", "summary": "9월 운세 한줄 요약", "luckyDay": "2일, 16일", "fieldScores": { "love": 82, "wealth": 92, "career": 88, "health": 85 } },
    { "month": 10, "score": 70, "theme": "안정의 달", "summary": "10월 운세 한줄 요약", "luckyDay": "8일, 23일", "fieldScores": { "love": 68, "wealth": 72, "career": 70, "health": 78 } },
    { "month": 11, "score": 75, "theme": "준비의 시간", "summary": "11월 운세 한줄 요약", "luckyDay": "6일, 20일", "fieldScores": { "love": 72, "wealth": 70, "career": 78, "health": 75 } },
    { "month": 12, "score": 80, "theme": "마무리와 감사", "summary": "12월 운세 한줄 요약", "luckyDay": "13일, 28일", "fieldScores": { "love": 78, "wealth": 82, "career": 76, "health": 80 } }
  ],
  "bestMonth": 5,
  "worstMonth": 6,
  "lovePeak": 5,
  "wealthPeak": 9,
  "careerPeak": 3,
  "annualAdvice": "올해 가장 중요한 핵심 메시지와 실천 방안 (80-120자).",
  "keywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"]
}

중요:
- months 배열은 정확히 12개 (1월~12월)
- score는 0-100 정수, 각 달의 천간지지와 사주 일간의 상호작용 반영
- fieldScores의 love/wealth/career/health 각각 0-100 정수 (전체 score와 상관관계 있게)
- bestMonth/worstMonth/lovePeak/wealthPeak/careerPeak은 1-12 정수
- 실제 사주 분석에 기반한 차별화된 월별 운세

[luckyDay 판정 기준 — 월 내 길일 2개 선정]
아래 우선순위 기준으로 각 달의 길일을 선정하세요:
1순위: 해당 월 내 용신(用神) 오행 일진 날짜 (천간 또는 지지 오행이 용신과 일치)
2순위: 해당 월 내 일진 지지가 사용자 일지(日支)와 육합(六合)이 되는 날
3순위: 해당 월 내 일진 천간이 사용자 일간(日干)과 천간합(天干合)이 되는 날
4순위: 위 조건 없으면 해당 월 score가 높은 달의 임의 2일 (예: 7일, 21일 형식)
- 우선순위 기준이 충족되면 구체적 날짜(예: "12일, 27일")로 명시, 없으면 길한 숫자 기준 2일 선정

[분야별 fieldScores 산정 원칙 — 십성(十星) 기반]
재물운(wealth):
  · 재성(財星) 투간 달 / 세운·월운에 재성 오행 강화 → 재물 기회
  · 신강일 때 재성 달 = 좋음 / 신약일 때 재성 달 = 부담 (체력 소모)
  · 식상(食傷) 달 → 신강이면 재물 생산 유리

애정운(love):
  · 남성: 재성(財星)이 배우자·이성성 → 재성 기운 강한 달에 인연·애정 활발
  · 여성: 관성(官星)이 배우자·이성성 → 관성 기운 강한 달에 인연·애정 활발
  · 합(合) 기운 달 — 육합·삼합이 월운과 겹치면 만남·화합 에너지 강화

직업·커리어운(career):
  · 관성(官星) 강한 달 → 직장·승진·공직 유리
  · 식신·상관(食傷) 강한 달 → 창업·프리랜서·아이디어 유리
  · 격국이 관격(正官·偏官格)이면 관성 달, 식신격·상관격이면 식상 달 중시

건강운(health):
  · 신약일 때 관성(官星) 많은 달 → 과로·스트레스 → 건강 주의 (health 낮게)
  · 신강일 때 인성(印星) 과한 달 → 과잉 에너지 축적 → 건강 주의
  · 충(冲) 많은 달 → 사고·수술 주의

[신살(神煞) fieldScores 반영 원칙]
신살이 있는 경우, 해당 신살의 특성을 월별 fieldScores에 반영:
  · 도화살(桃花煞): 월간 love +5~10, wealth -3~5 (이성 기회↑, 감정 지출)
  · 역마살(驛馬煞): career +3~8 (이동·외부 활동 달에 강화), health -3
  · 화개살(華蓋煞): career +10(예술·전문직 달), love -3~5 (고독·집중)
  · 양인살(羊刃煞): career +5~10, health -3~5 (부상·극단 주의)
  · 백호대살(白虎大煞): health -8~10 (건강 각별 주의), yearSummary에 경고 포함
  · 귀문관살(鬼門關煞): career +5(창의·직관 강한 달), health -3~5
  · 원진살(怨嗔煞): love -5~10, career -3 (대인관계 갈등 달에 반영)
  · 괴강살(魁罡煞): career +5~10, love -5~8 (권위·고집으로 인한 갈등)`

/**
 * 해당 연도의 절기(節氣) 정보 반환 — 사주 월령 기준 참고용
 *
 * 사주 월주(月柱)는 절기 기준으로 결정됩니다:
 *   인월(寅月): 입춘(立春)부터 / 묘월(卯月): 경칩(驚蟄)부터 / 진월(辰月): 청명(淸明)부터
 *   사월(巳月): 입하(立夏)부터 / 오월(午月): 망종(芒種)부터 / 미월(未月): 소서(小暑)부터
 *   신월(申月): 입추(立秋)부터 / 유월(酉月): 백로(白露)부터 / 술월(戌月): 한로(寒露)부터
 *   해월(亥月): 입동(立冬)부터 / 자월(子月): 대설(大雪)부터 / 축월(丑月): 소한(小寒)부터
 *
 * 주의: 운세 결과는 양력 1~12월 기준으로 출력합니다.
 *       아래 절기 날짜는 각 양력 달의 사주 월령 전환점 참고용으로만 사용하세요.
 */
function getJeolgiInfo(year: number): string {
  // 절기별 대략적 양력 날짜 (연도별 1-2일 오차 있음)
  // 사주 절기월(節氣月) 순서: 인월(1)~축월(12)
  const jeolgi = [
    { name: '입춘(立春) → 인월(寅月) 시작', month: 2, day: 4 },
    { name: '경칩(驚蟄) → 묘월(卯月) 시작', month: 3, day: 6 },
    { name: '청명(淸明) → 진월(辰月) 시작', month: 4, day: 5 },
    { name: '입하(立夏) → 사월(巳月) 시작', month: 5, day: 6 },
    { name: '망종(芒種) → 오월(午月) 시작', month: 6, day: 6 },
    { name: '소서(小暑) → 미월(未月) 시작', month: 7, day: 7 },
    { name: '입추(立秋) → 신월(申月) 시작', month: 8, day: 7 },
    { name: '백로(白露) → 유월(酉月) 시작', month: 9, day: 8 },
    { name: '한로(寒露) → 술월(戌月) 시작', month: 10, day: 8 },
    { name: '입동(立冬) → 해월(亥月) 시작', month: 11, day: 7 },
    { name: '대설(大雪) → 자월(子月) 시작', month: 12, day: 7 },
    { name: `소한(小寒) → 축월(丑月) 시작`, month: 1, day: 6 },
  ]
  return jeolgi.map(j => `  ${j.name}: ${year}년 ${j.month}월 ${j.day}일경`).join('\n')
}

export async function generateAnnualReading(
  birthDate: string,
  saju: SajuInfo,
  targetYear: number,
  detail?: SajuDetailedAnalysis,
  gender?: string | null
): Promise<AnnualResponse> {
  const genderNote = gender === 'male' ? '남성' : gender === 'female' ? '여성' : '성별 미입력'

  let userPrompt = `${birthDate}생 사용자의 ${targetYear}년 연간 운세를 월별로 분석해주세요.

사주팔자 정보:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

성별: ${genderNote}`

  if (detail) {
    const yongshin = getYongshin(saju, detail)
    userPrompt += `

일간 분석:
- 일간: ${detail.dayMaster.name} (${detail.dayMaster.element})
- 신강/신약: ${detail.bodyStrength}
- 격국(格局): ${detail.geokguk}
- 강한 오행: ${detail.dominantElement} / 약한 오행: ${detail.weakElement}
- 용신(用神): ${yongshin.yongshinFull} — ${yongshin.reason}
- 희신(喜神): ${yongshin.heungshin}
- 기신(忌神): ${yongshin.heukshin}

[월별 fieldScores 산정 추가 기준 — 용신/기신 오행 분야별 가중치]
아래 월운 목록의 [용신달(+8점)] 레이블 달 → 분야별 조정:
  · wealth: +10점 (용신 오행이 재물 흐름 강화)
  · career: +8점 (용신 오행이 사회 활동 지원)
  · love: +${genderNote === '여성' ? '10점 (관성 기운이 이성 에너지와 공명)' : '8점 (재성 기운이 이성 에너지와 공명)'}
  · health: +5점 (오행 균형 개선으로 활력)
[기신달(-8점)] 레이블 달 → 분야별 조정:
  · wealth: -8점 / career: -8점 / love: -6점 / health: -5점

십성(十星) 및 십이운성 구성:
${detail.pillarsDetail.filter(p => p.hangul).map(p => `- ${p.label}: ${p.hangul} → 십성(${p.sipseong || '일간'}), 십이운성(${p.sipiunsung || '없음'})`).join('\n')}

삼합·반합·형·충·합·해·파:
${detail.specialRelations.length > 0 ? detail.specialRelations.map(r => `- ${r.type}: ${r.chars.join('')} → ${r.meaning}`).join('\n') : '- 없음'}

신살: ${detail.sinsal.length > 0 ? detail.sinsal.map(s => s.name).join(', ') : '없음'}
공망(空亡): ${detail.gongmang ? `${detail.gongmang[0]}·${detail.gongmang[1]}` : '없음'}`
  }

  const birthYearJi = saju.yearPillar[1]
  const targetYearJi = getYearJi(targetYear)
  const samjae = getSamjae(birthYearJi, targetYearJi)

  // 세운(歲運) 천간지지 사전 계산 (AI 계산 오류 방지)
  const seunSaju = calculateSaju(targetYear, 6, 15)
  const seunPillar = seunSaju.yearPillar
  const seunPillarHanja = seunSaju.yearPillarHanja

  // 12개월 월운(月運) 천간지지 사전 계산 — 각 달 20일 기준 (절기 중반)
  const GAN_HANJA_A: Record<string, string> = {
    '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
    '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
  }
  const JI_HANJA_A: Record<string, string> = {
    '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
    '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
  }
  // 용신/기신 오행 월별 사전 계산용 상수
  const GAN_EL_A: Record<string, string> = {
    '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
    '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
  }
  const JI_EL_A: Record<string, string> = {
    '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
    '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수',
  }
  const yongshinForMonth = detail ? getYongshin(saju, detail) : null

  const dayGanForSipseong = saju.dayPillar[0]
  const userDayJiA = saju.dayPillar[1]
  const userYearJiA = saju.yearPillar[1]
  const userMonthJiA = saju.monthPillar[1]
  const CHUNG_PAIRS_A: [string, string][] = [
    ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해'],
  ]
  const YUKHAP_PAIRS_A: [string, string][] = [
    ['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미'],
  ]
  // 천간합(天干合) · 천간충(天干冲) 상수
  const CHEONGAN_HAP_PAIRS_A: [string, string][] = [
    ['갑', '기'], ['을', '경'], ['병', '신'], ['정', '임'], ['무', '계'],
  ]
  const CHEONGAN_CHUNG_PAIRS_A: [string, string][] = [
    ['갑', '경'], ['을', '신'], ['병', '임'], ['정', '계'],
  ]
  const allUserGanA = [saju.yearPillar[0], saju.monthPillar[0], saju.dayPillar[0], ...(saju.hourPillar ? [saju.hourPillar[0]] : [])]
  const gongmangJiListA = detail?.gongmangPillars?.map((p: { ji: string }) => p.ji) || (detail?.gongmang ? [...detail.gongmang] : [])
  const monthPillars = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const ms = calculateSaju(targetYear, m, 20)
    const mp = ms.monthPillar
    const sipseong = getSipseong(dayGanForSipseong, mp[0])
    const mJi = mp[1]
    const adjParts: string[] = []
    // 일지 충합
    if (CHUNG_PAIRS_A.some(([a, b]) => (mJi === a && userDayJiA === b) || (mJi === b && userDayJiA === a)))
      adjParts.push(`일지충(-8점)`)
    else if (YUKHAP_PAIRS_A.some(([a, b]) => (mJi === a && userDayJiA === b) || (mJi === b && userDayJiA === a)))
      adjParts.push(`일지합(+6점)`)
    // 년지 충합
    if (CHUNG_PAIRS_A.some(([a, b]) => (mJi === a && userYearJiA === b) || (mJi === b && userYearJiA === a)))
      adjParts.push(`년지충(-4점)`)
    else if (YUKHAP_PAIRS_A.some(([a, b]) => (mJi === a && userYearJiA === b) || (mJi === b && userYearJiA === a)))
      adjParts.push(`년지합(+3점)`)
    // 월지 충합
    if (CHUNG_PAIRS_A.some(([a, b]) => (mJi === a && userMonthJiA === b) || (mJi === b && userMonthJiA === a)))
      adjParts.push(`월지충(-5점)`)
    else if (YUKHAP_PAIRS_A.some(([a, b]) => (mJi === a && userMonthJiA === b) || (mJi === b && userMonthJiA === a)))
      adjParts.push(`월지합(+4점)`)
    // 형(刑) 사전 계산 — 삼형·자묘형·자형
    const allUserJiA = [userYearJiA, userMonthJiA, userDayJiA, ...(saju.hourPillar ? [saju.hourPillar[1]] : [])]
    for (const group of [['인', '신', '사'], ['축', '술', '미']]) {
      if (group.includes(mJi)) {
        const matchCount = group.filter(ji => ji !== mJi && allUserJiA.includes(ji)).length
        if (matchCount >= 2) { adjParts.push('삼형완성(-8점)'); break }
        if (matchCount === 1) { adjParts.push('부분형(-4점)'); break }
      }
    }
    if ((mJi === '자' && allUserJiA.includes('묘')) || (mJi === '묘' && allUserJiA.includes('자')))
      adjParts.push('자묘형(-4점)')
    if (['오', '진', '유', '해'].includes(mJi) && allUserJiA.includes(mJi))
      adjParts.push('자형(-3점)')
    // 월간 천간합·충 사전 계산 — 사주 원국 천간과 비교
    const mGan = mp[0]
    const ganHapMatch = allUserGanA.find(ug => CHEONGAN_HAP_PAIRS_A.some(([a, b]) => (mGan === a && ug === b) || (mGan === b && ug === a)))
    const ganChungMatch = allUserGanA.find(ug => CHEONGAN_CHUNG_PAIRS_A.some(([a, b]) => (mGan === a && ug === b) || (mGan === b && ug === a)))
    if (ganHapMatch) adjParts.push(`천간합(${mGan}${ganHapMatch},+5점)`)
    if (ganChungMatch) adjParts.push(`천간충(${mGan}↔${ganChungMatch},-8점)`)
    // 공망달(-5점) / 공망 해소(+3점)
    if (gongmangJiListA.includes(mJi)) {
      adjParts.push('공망달(-5점)')
    } else {
      const resolvesA = gongmangJiListA.filter((gji: string) =>
        CHUNG_PAIRS_A.some(([a, b]) => (mJi === a && gji === b) || (mJi === b && gji === a))
      )
      if (resolvesA.length > 0) adjParts.push('공망해소(+3점)')
      else {
        const hapResolvesA = gongmangJiListA.filter((gji: string) =>
          YUKHAP_PAIRS_A.some(([a, b]) => (mJi === a && gji === b) || (mJi === b && gji === a))
        )
        if (hapResolvesA.length > 0) adjParts.push('공망합해소(+2점)')
      }
    }
    // 용신/기신 오행 사전 계산 — fieldScores 조정 기준
    if (yongshinForMonth) {
      const ganElA = GAN_EL_A[mp[0]] || ''
      const jiElA = JI_EL_A[mJi] || ''
      const yongshinElA = yongshinForMonth.yongshin
      const heukshinElA = yongshinForMonth.heukshin.split('(')[0]
      if (ganElA === yongshinElA || jiElA === yongshinElA)
        adjParts.push('용신달(+8점)')
      else if (ganElA === heukshinElA || jiElA === heukshinElA)
        adjParts.push('기신달(-8점)')
    }
    const adjStr = adjParts.length > 0 ? ` [${adjParts.join(' ')}]` : ''
    return `  · ${m}월: ${mp}(${GAN_HANJA_A[mp[0]] || ''}${JI_HANJA_A[mp[1]] || ''}) 월간십성: ${sipseong}${adjStr}`
  })

  // 대운(大運) 현황 사전 계산
  const birthYearGan = saju.yearPillar[0]
  const isYangYear = ['갑', '병', '무', '경', '임'].includes(birthYearGan)
  let daeunDirection = '불명확'
  if (gender === 'male') daeunDirection = isYangYear ? '순행(順行)' : '역행(逆行)'
  else if (gender === 'female') daeunDirection = isYangYear ? '역행(逆行)' : '순행(順行)'
  const daeunStart = calculateDaeunStartAge(birthDate, birthYearGan, gender)
  const daeunDir = daeunDirection.includes('순행') ? 'forward' : 'reverse'
  const daeunPillars = calculateDaeunPillars(saju.monthPillar, daeunDir, daeunStart, 8)
  const birthYear = parseInt(birthDate.split('-')[0])
  const currentAge = targetYear - birthYear + 1
  const currentDaeun = daeunPillars.findLast(d => d.age <= currentAge)
  const nextDaeun = daeunPillars.find(d => d.age > currentAge)

  userPrompt += `

삼재(三災): ${samjae.isSamjae ? `${samjae.type} — ${samjae.description}` : '해당 없음'}

[${targetYear}년 세운(歲運) 정보 — 사전 계산값]
- ${targetYear}년 세운 간지: ${seunPillar}(${seunPillarHanja})
- 세운 천간 십성: 일간 ${saju.dayPillar[0]} 기준 세운 천간 ${seunPillar[0]}는 → ${getSipseong(saju.dayPillar[0], seunPillar[0])}
  (세운 십성 의미를 yearSummary·annualAdvice에 반영: 편재년=재물기회·변화·대인운, 정관년=안정·승진·명예, 편관년=도전·압박, 식신년=결실·여유, 인성년=학문·귀인·내실)
- 세운 지지↔사주 지지 충합 (코드 계산값):
${(() => {
  const seunJi = seunPillar[1]
  const lines: string[] = []
  if (CHUNG_PAIRS_A.some(([a,b]) => (seunJi===a&&userDayJiA===b)||(seunJi===b&&userDayJiA===a)))
    lines.push(`  ⚠️ 세운 지지(${seunJi})↔일지(${userDayJiA}): 충(冲) — 심리 불안·변화·갈등 주의, yearSummary에 반영 + 전체 score -8점 기준`)
  else if (YUKHAP_PAIRS_A.some(([a,b]) => (seunJi===a&&userDayJiA===b)||(seunJi===b&&userDayJiA===a)))
    lines.push(`  ✅ 세운 지지(${seunJi})↔일지(${userDayJiA}): 합(合) — 감정·배우자·인연 안정, yearSummary에 반영 + 전체 score +6점 기준`)
  if (CHUNG_PAIRS_A.some(([a,b]) => (seunJi===a&&userYearJiA===b)||(seunJi===b&&userYearJiA===a)))
    lines.push(`  ⚠️ 세운 지지(${seunJi})↔년지(${userYearJiA}): 충(冲) — 뿌리·환경 변동 주의, yearSummary에 반영`)
  else if (YUKHAP_PAIRS_A.some(([a,b]) => (seunJi===a&&userYearJiA===b)||(seunJi===b&&userYearJiA===a)))
    lines.push(`  ✅ 세운 지지(${seunJi})↔년지(${userYearJiA}): 합(合) — 출발점 기운 강화, yearSummary에 반영`)
  if (CHUNG_PAIRS_A.some(([a,b]) => (seunJi===a&&userMonthJiA===b)||(seunJi===b&&userMonthJiA===a)))
    lines.push(`  ⚠️ 세운 지지(${seunJi})↔월지(${userMonthJiA}): 충(冲) — 직업·사회운 변동, yearSummary에 반영`)
  else if (YUKHAP_PAIRS_A.some(([a,b]) => (seunJi===a&&userMonthJiA===b)||(seunJi===b&&userMonthJiA===a)))
    lines.push(`  ✅ 세운 지지(${seunJi})↔월지(${userMonthJiA}): 합(合) — 직업·사회운 활성화, yearSummary에 반영`)
  return lines.length > 0 ? lines.join('\n') : `  · 세운 지지(${seunJi})와 사주 지지(일지·년지·월지) 간 특별한 충합 없음`
})()}

[${targetYear}년 월운(月運) 천간지지 — 각 달 절기 기준 사전 계산]
※ 이 값을 기준으로 월별 운세를 산출하세요 (AI 계산 불필요):
${monthPillars.join('\n')}

[대운(大運) 현황]
- 대운 방향: ${daeunDirection}
- 대운 시작 나이: ${daeunStart}세${currentDaeun ? `\n- 현재 대운(${targetYear}년 기준): ${currentDaeun.pillar}(${currentDaeun.hanja}) — ${currentDaeun.age}세 대운\n  · 천간기(前5년): ${currentDaeun.age}~${currentDaeun.age + 4}세 (${currentDaeun.pillar[0]}천간 영향, 사회·외부 운)\n  · 지지기(後5년): ${currentDaeun.age + 5}~${currentDaeun.age + 9}세 (${currentDaeun.pillar[1]}지지 영향, 내면·가정 운)` : ''}${nextDaeun ? `\n- 다음 대운: ${nextDaeun.pillar}(${nextDaeun.hanja}) — ${nextDaeun.age}세부터` : ''}

[세운 천간 × 대운 천간 교차분석 — 코드 계산값]
${(() => {
  const seunGanA = seunPillar[0]
  const daeunGanA = currentDaeun?.pillar[0]
  if (!daeunGanA) return '  · 대운 정보 없음'
  const isHap = CHEONGAN_HAP_PAIRS_A.some(([a, b]) => (seunGanA === a && daeunGanA === b) || (seunGanA === b && daeunGanA === a))
  const isChung = CHEONGAN_CHUNG_PAIRS_A.some(([a, b]) => (seunGanA === a && daeunGanA === b) || (seunGanA === b && daeunGanA === a))
  if (isHap) return `  ✅ 세운 천간(${seunGanA}) × 대운 천간(${daeunGanA}): 천간합 — 큰 흐름 상호 협력, yearSummary +5점 기준`
  if (isChung) return `  ⚠️ 세운 천간(${seunGanA}) × 대운 천간(${daeunGanA}): 천간충 — 내외 흐름 충돌, yearSummary -8점 기준`
  return `  · 세운 천간(${seunGanA}) × 대운 천간(${daeunGanA}): 합충 없음`
})()}

세운·월운·대운의 교차 분석을 반영하여 월별 운세를 산출해주세요.

[운세 가중치 원칙]
- 세운(歲運): 연간 운세의 기본 베이스 (60% 영향)
- 월운(月運): 월별 점수 조정값 (30% 영향)
- 대운(大運): 10년 흐름 배경 (10% 영향)
- 적용: 세운 기본 방향에 월운이 순응하면 +5~10점, 역행하면 -5~10점 조정

[삼재(三災) 분야별·분기별 적용 원칙]
삼재가 있는 경우 yearSummary와 annualAdvice에 반드시 반영하고, 월별 점수를 분기별로 차등 하향 조정:
- 들삼재(삼재 첫 해): 시작의 충격, 큰 변화·이동·사고 주의
  · 1분기(1~3월): 가장 강한 타격 — score -6~9점 (이동·변화·시작 최대 주의)
  · 2분기(4~6월): 여진 지속 — score -5~8점
  · 3분기(7~9월): 점차 완화 — score -3~5점
  · 4분기(10~12월): 안정 회복 시작 — score -2~3점
  예) "올해는 들삼재로 시작의 해입니다. 1분기 큰 결정·이동은 최대한 미루고 안전을 최우선으로 하세요."
- 눌삼재(삼재 중간 해): 감정·재물 기복, 인내의 해
  · 1분기(1~3월): 전년도 들삼재 여파 — score -4~6점
  · 2분기(4~6월): 기복의 정점 — score -5~8점 (재물·감정 롤러코스터)
  · 3분기(7~9월): 인내 유지 — score -3~5점
  · 4분기(10~12월): 후반 회복 신호 — score -2~3점
  예) "눌삼재의 해로 인내와 절제가 열쇠입니다. 욕심을 내려놓으면 4분기부터 회복됩니다."
- 날삼재(삼재 마지막 해): 마무리·정리·결산의 해
  · 1분기(1~3월): 삼재 마지막 기운 — score -4~6점
  · 2분기(4~6월): 정리의 분기 — score -3~5점
  · 3분기(7~9월): 점차 걷힘 — score -1~3점
  · 4분기(10~12월): 삼재 기운 해소, 새 출발 준비 — score 정상
  예) "날삼재로 삼재의 기운이 걷히는 해입니다. 상반기 정리를 잘하면 4분기부터 새 출발을 준비할 수 있습니다."${detail ? `

[십이운성(十二運星) 기반 월별 강약 참고]
일간 ${detail.dayMaster.name} 기준 각 월운 지지의 십이운성:
${(() => {
  const GAN_HANJA_B: Record<string, string> = { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' }
  const JI_HANJA_B: Record<string, string> = { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' }
  const dayGan = detail.dayMaster.name[0]
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const ms = (() => { try { return calculateSaju(targetYear, m, 20) } catch { return null } })()
    if (!ms) return ''
    const ji = ms.monthPillar[1]
    const unsung = getSipiuUnsung(dayGan, ji)
    const strength = unsung === '제왕' ? '★★★절정운' : unsung === '임관' ? '★★상승운' : ['장생', '관대'].includes(unsung) ? '★좋음' : unsung === '쇠' ? '△소강' : ['묘', '절'].includes(unsung) ? '▼▼정체주의' : ['병', '사'].includes(unsung) ? '▼하향주의' : ''
    return `  · ${m}월(${ms.monthPillar}): 십이운성 ${unsung}(${JI_HANJA_B[ji] || ''}) ${strength}`
  }).filter(Boolean).join('\n')
})()}

[공망(空亡) 월운 교차 분석]
공망 지지: ${detail.gongmang ? `${detail.gongmang[0]}·${detail.gongmang[1]}` : '없음'} — 월운 지지와 겹치는 달은 기대·계획이 허황되거나 변수가 생길 수 있으므로 score를 약간 낮추고 summary에 반영하세요.
${detail.gongmangPillars && detail.gongmangPillars.length > 0 ? `공망 위치: ${detail.gongmangPillars.map(p => `${p.label}(${p.ji}) — ${p.meaning}`).join(' / ')}` : ''}` : ''}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
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
    return JSON.parse(jsonText) as AnnualResponse
  } catch (e) {
    console.error('[Annual] JSON parse failed. Raw:', jsonText.slice(0, 500))
    throw new Error('AI 응답 파싱 실패')
  }
}
