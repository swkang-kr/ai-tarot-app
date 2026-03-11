import { anthropic } from '@/lib/ai/client'
import type { SajuInfo, SajuDetailedAnalysis } from '@/lib/utils/saju'
import { getSamjae, getYearJi, calculateDaeunStartAge, calculateDaeunPillars } from '@/lib/utils/saju'
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
- 실제 사주 분석에 기반한 차별화된 월별 운세`

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
    userPrompt += `

일간 분석:
- 일간: ${detail.dayMaster.name} (${detail.dayMaster.element})
- 신강/신약: ${detail.bodyStrength}
- 격국(格局): ${detail.geokguk}
- 강한 오행: ${detail.dominantElement} / 약한 오행: ${detail.weakElement}

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
  const monthPillars = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const ms = calculateSaju(targetYear, m, 20)
    const mp = ms.monthPillar
    return `  · ${m}월: ${mp}(${GAN_HANJA_A[mp[0]] || ''}${JI_HANJA_A[mp[1]] || ''})`
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

[${targetYear}년 월운(月運) 천간지지 — 각 달 절기 기준 사전 계산]
※ 이 값을 기준으로 월별 운세를 산출하세요 (AI 계산 불필요):
${monthPillars.join('\n')}

[대운(大運) 현황]
- 대운 방향: ${daeunDirection}
- 대운 시작 나이: ${daeunStart}세${currentDaeun ? `\n- 현재 대운(${targetYear}년 기준): ${currentDaeun.pillar}(${currentDaeun.hanja}) — ${currentDaeun.age}세 대운` : ''}${nextDaeun ? `\n- 다음 대운: ${nextDaeun.pillar}(${nextDaeun.hanja}) — ${nextDaeun.age}세부터` : ''}

세운·월운·대운의 교차 분석을 반영하여 월별 운세를 산출해주세요.
애정운, 재물운, 커리어운의 피크 시기를 분석하고,
삼재가 있는 경우 yearSummary와 annualAdvice에 반드시 반영하세요.`

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
