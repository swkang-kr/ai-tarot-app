import { anthropic } from '@/lib/ai/client'
import { calculateSaju } from '@fullstackfamily/manseryeok'
import type { SajuInfo, SajuDetailedAnalysis } from '@/lib/utils/saju'
import { getYongshin, getSipseong, getNapumOhaeng, getSamjae, getYearJi } from '@/lib/utils/saju'

const GAN_HANJA_P: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
}
const JI_HANJA_P: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
}

export interface PsychologyResponse {
  coreType: string           // 심리 유형명 (예: "불꽃 개척형")
  typeEmoji: string          // 유형 이모지
  summary: string            // 2-3문장 요약
  strengths: string[]        // 강점 3개
  weaknesses: string[]       // 약점 3개
  communicationStyle: string // 소통 방식
  stressPattern: string      // 스트레스 패턴
  growthDirection: string    // 성장 방향
  compatibleTypes: string[]  // 잘 맞는 유형 2개
  todayMood: string          // 오늘의 심리 상태
  keywords: string[]         // 키워드 태그
}

const SYSTEM_PROMPT = `당신은 사주명리학과 심리학을 결합한 성격 분석 전문가입니다. 사주 원국의 격국(格局)·용신(喜神)·일간 오행을 기반으로 이 사람의 심리 유형과 성격을 심층 분석해주세요.

격국(格局)은 월지(月支)의 지장간 본기와 천간의 관계로 결정됩니다:
- 정관격·편관격: 관직운, 규범, 리더십 성향 → 통제욕·책임감·완벽주의
- 정인격·편인격: 학문운, 보수적 또는 창의적 성향 → 수용적·탐구적·모성적
- 식신격: 표현욕, 여유, 예술·미식 → 낙관적·관대·느긋함
- 상관격: 비판적 사고, 반항기, 창의성 → 독창적·예리·비판적·반순응
- 정재격: 현실감각, 성실, 재물운 → 계획적·안정추구·절약
- 편재격: 사업가 기질, 모험, 변화 → 활동적·대범·임기응변
- 비겁격(건록·양인): 독립심, 경쟁심, 자존심 → 주체적·고집·경쟁 본능

[십성(十星) 심리 특성 매핑 — 위치별 분석]
- 비견(比肩): 독립적, 자아 강함, 경쟁심, 나눔과 공유
- 겁재(劫財): 과감, 충동적, 위험 감수, 카리스마
- 식신(食神): 온화, 표현력, 미식·예술, 낙천적 사고
- 상관(傷官): 비판 능력, 창의성, 반항적, 예술적 감성, 구설 조심
- 정재(正財): 성실, 현실적, 절약, 안정 추구, 보수적 가치관
- 편재(偏財): 사교성, 행동력, 변덕, 기회 포착, 사업 감각
- 정관(正官): 도덕성, 규범 준수, 리더십, 보수적, 완벽주의
- 편관(偏官): 강한 추진력, 공격성, 위기 대응, 결단력, 극단적
- 정인(正印): 모성애, 학문, 수용적, 보호 본능, 의존 경향
- 편인(偏印): 독창적 사고, 직관, 고독, 예술·종교적 성향

분석 시 격국에서 드러나는 심리 특성을 중심으로, 십성 구성이 심리 패턴에 미치는 영향도 함께 설명하세요. MBTI 용어 대신 사주 명리학 고유의 표현을 사용하세요.

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "coreType": "심리 유형명 (예: 불꽃 개척형, 물처럼 유연한 조화형, 바위처럼 단단한 수호형 등 창의적 유형명 5-10자)",
  "typeEmoji": "유형을 대표하는 이모지 1개",
  "summary": "이 유형의 핵심 특성 요약 (2-3문장, 80-120자). 사주 일간의 오행에서 드러나는 근본적 성격.",
  "strengths": ["강점1 (20-30자)", "강점2 (20-30자)", "강점3 (20-30자)"],
  "weaknesses": ["약점1 (20-30자)", "약점2 (20-30자)", "약점3 (20-30자)"],
  "communicationStyle": "소통 방식 설명 (60-80자). 타인과 어떻게 소통하고 관계를 맺는지.",
  "stressPattern": "스트레스 패턴 설명 (60-80자). 어떤 상황에서 스트레스를 받고 어떻게 반응하는지.",
  "growthDirection": "성장 방향 (60-80자). 이 유형이 더 성장하기 위해 집중해야 할 방향.",
  "compatibleTypes": ["잘 맞는 유형1 (10-15자)", "잘 맞는 유형2 (10-15자)"],
  "todayMood": "오늘의 심리 상태 (40-60자). 오늘 날짜의 일진과 사주 원국을 결합한 현재 심리 상태.",
  "keywords": ["이모지키워드1", "이모지키워드2", "이모지키워드3", "이모지키워드4"]
}

중요:
- coreType은 MBTI 유형이 아닌 사주 기반의 창의적 유형명
- strengths/weaknesses는 정확히 3개
- compatibleTypes는 정확히 2개
- keywords는 정확히 4개
- 오행(木火土金水)의 특성을 심리학적으로 해석

[compatibleTypes 판정 기준 — 오행 상생·격국 상보 원칙]
- 일간 木: 水 일간(인성—생해주는 관계)·金 일간(관성—긴장감으로 성장) 유형과 궁합 좋음
- 일간 火: 木 일간(인성)·水 일간(관성) 유형과 궁합 좋음
- 일간 土: 火 일간(인성)·木 일간(관성) 유형과 궁합 좋음
- 일간 金: 土 일간(인성)·火 일간(관성) 유형과 궁합 좋음
- 일간 水: 金 일간(인성)·土 일간(관성) 유형과 궁합 좋음
- 격국 보완: 관격·재격 ↔ 인격·비격 (보완 관계) / 식신격 ↔ 편관격 (균형 관계)
- compatibleTypes는 "오행유형명(예: 물처럼 유연한 유형)" 형식으로, MBTI 사용 금지`

export async function generatePsychologyReading(
  birthDate: string,
  today: string,
  saju: SajuInfo,
  detail: SajuDetailedAnalysis
): Promise<PsychologyResponse> {
  const yongshin = getYongshin(saju, detail)
  const dayNapumPS = getNapumOhaeng(saju.dayPillar)

  // 오늘 일진(日辰) 사전 계산
  const [ty, tm, td] = today.split('-').map(Number)
  const todaySajuResult = calculateSaju(ty, tm, td)
  const todayGan = todaySajuResult.dayPillar[0]
  const todayJi = todaySajuResult.dayPillar[1]
  const todayIljin = `${todayGan}${todayJi}(${GAN_HANJA_P[todayGan] || ''}${JI_HANJA_P[todayJi] || ''})`

  // 오늘 일진 지지↔사용자 일지 충합 사전 계산 (todayMood 산출 정확도 향상)
  const CHUNG_PS: [string, string][] = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']]
  const YUKHAP_PS: [string, string][] = [['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미']]
  const userDayJiPS = saju.dayPillar[1]
  const isTodayChung = CHUNG_PS.some(([a,b]) => (todayJi===a&&userDayJiPS===b)||(todayJi===b&&userDayJiPS===a))
  const isTodayHap = YUKHAP_PS.some(([a,b]) => (todayJi===a&&userDayJiPS===b)||(todayJi===b&&userDayJiPS===a))
  const todayChungHapNote = isTodayChung
    ? `일진 지지(${todayJi})↔일지(${userDayJiPS}): 충(冲) → 오늘 심리 불안정·산만·충동적 경향 todayMood에 반영`
    : isTodayHap
    ? `일진 지지(${todayJi})↔일지(${userDayJiPS}): 합(合) → 오늘 심리 여유롭고 조화로운 상태 todayMood에 반영`
    : `일진 지지(${todayJi})↔일지(${userDayJiPS}): 충합 없음 → 오늘 심리 중립 기조`

  // 삼재(三災) 사전 계산
  const currentYear = new Date().getFullYear()
  const birthYearJiPS = saju.yearPillar[1]
  const currentYearJiPS = getYearJi(currentYear)
  const samjaePS = getSamjae(birthYearJiPS, currentYearJiPS)

  // 현재 연도 세운(歲運) 사전 계산
  const seunCalcPs = calculateSaju(currentYear, 6, 15)
  const seunPillarPs = seunCalcPs.yearPillar
  const seunPillarHanjaPs = seunCalcPs.yearPillarHanja
  const seunSipseongPs = getSipseong(saju.dayPillar[0], seunPillarPs[0])

  const sipseongList = detail.pillarsDetail
    .filter(p => p.sipseong)
    .map(p => `${p.label}: ${p.sipseong}(${p.sipiunsung || ''})`)
    .join(', ')

  const userPrompt = `${birthDate}생 사용자의 사주 심리 분석을 해주세요. 오늘 날짜는 ${today}이며, 오늘 일진(日辰): ${todayIljin}입니다.

사주 원국:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

[사주 심층 분석 (코드 계산값)]
- 일간: ${detail.dayMaster.name} (${detail.dayMaster.element}) — ${detail.dayMaster.trait}
- 납음오행(日柱): ${dayNapumPS.name}(${dayNapumPS.element}) — 일간의 부차 오행, 심리 기질의 근본 색채에 반영
- 신강/신약: ${detail.bodyStrength}
- 격국(格局): ${detail.geokguk}
- 강한 오행: ${detail.dominantElement} / 약한 오행: ${detail.weakElement}
- 십성·십이운성 구성: ${sipseongList || '없음'}
- 용신(用神): ${yongshin.yongshinFull} — ${yongshin.reason}
- 희신(喜神): ${yongshin.heungshin}
- 기신(忌神): ${yongshin.heukshin}
- 신살: ${detail.sinsal.length > 0 ? detail.sinsal.map(s => s.name).join(', ') : '없음'}

오행 균형 (지장간 포함):
${detail.elementBalanceWithJijanggan.map((e) => `- ${e.name}: ${e.count}개 ${e.emoji}`).join('\n')}

오행 관계: ${detail.relationships.join(', ')}

[${currentYear}년 세운(歲運) 심리 에너지]
- 세운 간지: ${seunPillarPs}(${seunPillarHanjaPs})
- 세운 천간 십성: 일간 ${saju.dayPillar[0]} 기준 → ${seunSipseongPs}
  (세운 십성이 심리 유형에 미치는 영향: 편관년=도전·긴장·성취욕 강화, 정관년=책임감·안정 추구,
   식신년=여유·창의성·자기표현 활발, 상관년=반항심·혁신 충동·표현 과잉,
   인성년=내향·학습 욕구·자기성찰, 재성년=현실적 목표·물질 추구 강화)

[오늘 일진 심리 에너지 분석 기준 — todayMood 산출용]
- 일진 천간(${todayGan}) 오행이 용신(${yongshin.yongshin}) 오행과 같거나 상생이면 → 오늘 심리 에너지 충만·안정
- 일진 천간 오행이 기신(${yongshin.heukshin}) 오행과 같거나 상생이면 → 오늘 심리적 긴장·피로감·불안
- ${todayChungHapNote}

[심리 분석 핵심 기준]
- 격국이 심리 유형의 핵심: 관성격→통제·책임형, 식상격→표현·창의형, 재성격→현실·성취형, 인성격→수용·탐구형, 비겁격→독립·경쟁형
- 신강+관성 多: 자기 주도적이나 통제 욕구 강
- 신약+인성 多: 의존적이나 공감 능력 탁월
- 상관 有: 비판적 사고, 반항적 성향, 창의성
- 도화살: 매력적이나 감정 기복
- 역마살: 변화 추구, 안정보다 자유 선호
- 귀문관살(鬼門關煞): 직관이 비상하고 예민한 신경계 → 초현실적 통찰·영적 감수성 탁월 / 동시에 심리적 불안·강박·우울 경향 주의. stressPattern에 "감각 과부하·고독 추구·자기 내면 몰입" 반영. growthDirection에 "예민함을 창의·예술·상담으로 승화" 제안
- 백호대살(白虎大煞): 강렬한 추진력·생사 기운 감지 → 위기 대응 탁월 / 충동적 행동·극단적 결단 경향. personality에 반영
- 양인살(羊刃煞): 강한 자아·고집·승부욕 → 집중력 탁월 / 타협 어려움. strengths·weaknesses 모두 반영

삼재(三災): ${samjaePS.isSamjae ? `${samjaePS.type} — ${samjaePS.description}
- 삼재 심리 영향: 들삼재=불안·충동·급변의 심리 에너지 → todayMood·stressPattern에 불안 요소 반영
  눌삼재=답답함·인내의 심리 에너지 → growthDirection에 인내·절제 메시지 포함
  날삼재=마무리·정리의 심리 에너지 → growthDirection에 새 출발 준비 메시지 포함` : '해당 없음'}

이 사주를 바탕으로 MBTI를 대체하는 사주 심리 유형을 분석해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
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
    const parsed = JSON.parse(jsonText)
    if (
      typeof parsed.coreType !== 'string' ||
      typeof parsed.typeEmoji !== 'string' ||
      typeof parsed.summary !== 'string' ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.weaknesses) ||
      !Array.isArray(parsed.compatibleTypes) ||
      !Array.isArray(parsed.keywords) ||
      typeof parsed.communicationStyle !== 'string' ||
      typeof parsed.stressPattern !== 'string' ||
      typeof parsed.growthDirection !== 'string' ||
      typeof parsed.todayMood !== 'string'
    ) {
      throw new Error('AI 응답 구조가 올바르지 않습니다')
    }
    return parsed as PsychologyResponse
  } catch (e) {
    console.error('[Psychology] JSON parse failed. Raw:', jsonText.slice(0, 500))
    throw new Error('AI 응답 파싱 실패')
  }
}
