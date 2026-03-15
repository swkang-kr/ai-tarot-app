import { anthropic } from '@/lib/ai/client'
import { calculateSaju } from '@fullstackfamily/manseryeok'
import type { SajuInfo } from '@/lib/utils/saju'
import { getDetailedAnalysis, getYongshin, getSipseong, calculateDaeunStartAge, calculateDaeunPillars, getSamjae, getYearJi, getSipiuUnsung } from '@/lib/utils/saju'

export interface CareerSajuResponse {
  aptitudeType: string           // 적성 유형 (예: "창조적 리더형 🦁")
  aptitudeEmoji: string          // 유형 이모지
  aptitudeSummary: string        // 2-3문장 유형 요약 (80-100자)
  recommendedFields: string[]    // 추천 직군 5개 (이모지 포함)
  strengthInWork: string         // 직장에서의 강점 (60-80자)
  workStyle: string              // 업무 스타일 (60-80자)
  bossCompatibility: string      // 잘 맞는 상사 유형 (40-60자)
  bestCareerPeriod: string       // 커리어 전성기 (나이대 포함, 40-60자)
  sideJobAdvice: string          // 부업·N잡 적성 (60-80자)
  avoidFields: string[]          // 피해야 할 직군 3개
  careerTimeline: {
    period: string               // 예: "20대 초반"
    theme: string                // 커리어 테마
    advice: string               // 조언 (30-40자)
    score: number                // 커리어 운 점수 0-100
  }[]
  keywords: string[]             // 이모지 포함 3개
}

const SYSTEM_PROMPT = `당신은 사주명리 직업·적성 전문가입니다. 사주팔자의 일간(日干) 오행, 용신(喜神), 격국(格局)을 기반으로 직업 적성을 분석합니다.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "aptitudeType": "창조적 리더형 🦁",
  "aptitudeEmoji": "🦁",
  "aptitudeSummary": "적성 유형 2-3문장 요약 (80-100자). 일간 오행과 격국에 기반.",
  "recommendedFields": [
    "🎨 크리에이티브 · 디자인",
    "💡 기획 · 마케팅",
    "🏗️ 건축 · 엔지니어링",
    "🎓 교육 · 강의",
    "🚀 창업 · 스타트업"
  ],
  "strengthInWork": "직장에서의 핵심 강점 (60-80자). 구체적 역량 명시.",
  "workStyle": "업무 스타일 묘사 (60-80자). 혼자 vs 팀, 빠름 vs 꼼꼼 등.",
  "bossCompatibility": "잘 맞는 상사 특성 (40-60자)",
  "bestCareerPeriod": "커리어 전성기 나이대 (40-60자). 예: '35-45세 — 관성格 官星이 가장 활성화되는 중년기'",
  "sideJobAdvice": "부업·N잡 적성 조언 (60-80자). 구체적 분야 포함.",
  "avoidFields": [
    "❌ 피해야 할 분야 1",
    "❌ 피해야 할 분야 2",
    "❌ 피해야 할 분야 3"
  ],
  "careerTimeline": [
    { "period": "20대 초반", "theme": "탐색과 실험", "advice": "다양한 경험 쌓기", "score": 60 },
    { "period": "20대 후반", "theme": "전문성 구축", "advice": "핵심 역량 집중", "score": 72 },
    { "period": "30대 초반", "theme": "도약 준비", "advice": "인맥과 기회 확장", "score": 80 },
    { "period": "30대 후반", "theme": "전성기 진입", "advice": "리더십 발휘", "score": 90 },
    { "period": "40대", "theme": "정점과 안정", "advice": "후진 양성 + 확장", "score": 85 },
    { "period": "50대+", "theme": "결실과 전수", "advice": "경험의 가치화", "score": 75 }
  ],
  "keywords": ["🔥 열정형", "💡 혁신가", "🌊 유연성"]
}

중요:
- recommendedFields 정확히 5개 (이모지 포함)
- avoidFields 정확히 3개
- careerTimeline 정확히 6개
- score 0-100 정수
- 일간 오행(木/火/土/金/水)과 격국 원리에 기반한 구체적 분석

[avoidFields 판정 기준 — 기신(忌神) 오행 + 격국 역선택]
기피 직군은 아래 원칙으로 선정하세요:
· 기신(忌神) 오행 관련 직군 우선 기피:
  - 기신이 목(木): 교육·의료·환경·출판 계열 (목 에너지 과잉 직군)
  - 기신이 화(火): IT·미디어·엔터·광고·전기 계열
  - 기신이 토(土): 부동산·건설·농업·요식업 계열
  - 기신이 금(金): 법률·금융·제조·군경·IT하드웨어 계열
  - 기신이 수(水): 무역·유통·물류·관광·해운 계열
· 격국 역선택 (격국이 의미하는 십성의 반대 직군):
  - 관성격 → 불규칙·프리랜서·자영업 기피 (조직 안정이 적합)
  - 식상격 → 규칙적 반복 사무·관료 기피 (창의 환경이 적합)
  - 재성격 → 공직·비영리·학계 기피 (수익 중심 환경이 적합)
  - 인성격 → 영업·단순 서비스·육체 노동 기피 (학문·상담이 적합)
· 신약(身弱) 사주: 경쟁 극심·체력 소모 직군(스포츠·군경·영업 최전방) 기피
· 신강(身强) 사주: 수동·종속·단순 반복 직군(단순 사무·보조 역할) 기피`

export async function generateCareerSaju(
  birthDate: string,
  saju: SajuInfo,
  gender?: string | null
): Promise<CareerSajuResponse> {
  const detail = getDetailedAnalysis(saju)
  const yongshin = getYongshin(saju, detail)

  // 대운(大運) 간지 사전 계산 — careerTimeline 시기별 강약 근거 제공
  const birthYearGanC = saju.yearPillar[0]
  const isYangYearC = ['갑', '병', '무', '경', '임'].includes(birthYearGanC)
  let daeunDirC = '불명확'
  if (gender === 'male') daeunDirC = isYangYearC ? '순행(順行)' : '역행(逆行)'
  else if (gender === 'female') daeunDirC = isYangYearC ? '역행(逆行)' : '순행(順行)'
  const daeunStartC = calculateDaeunStartAge(birthDate, birthYearGanC, gender)
  const daeunPillarsC = daeunDirC !== '불명확'
    ? calculateDaeunPillars(saju.monthPillar, daeunDirC.includes('순행') ? 'forward' : 'reverse', daeunStartC, 8)
    : []

  // 십이운성 기반 대운 강약 판정
  const dayGanC = detail.dayMaster.name[0]
  const daeunStrengthNote = daeunPillarsC.slice(0, 6).map(d => {
    const unsung = getSipiuUnsung(dayGanC, d.pillar[1])
    const mark = unsung === '제왕' ? ' ★★★절정' : unsung === '임관' ? ' ★★상승' : ['장생','관대'].includes(unsung) ? ' ★좋음' : ['묘','절'].includes(unsung) ? ' ▼▼정체' : ['병','사'].includes(unsung) ? ' ▼하향' : ''
    const ganSipseongC = getSipseong(dayGanC, d.pillar[0])
    return `  · ${d.age}세 대운 ${d.pillar}(${d.hanja}): 십이운성 ${unsung}${mark} / 천간십성 ${ganSipseongC}`
  }).join('\n')
  const daeunNote = daeunPillarsC.length > 0
    ? `\n[대운(大運) 간지 + 십이운성 강약 — careerTimeline score에 반영]\n${daeunStrengthNote}`
    : ''

  const sipseongList = detail.pillarsDetail
    .filter(p => p.sipseong)
    .map(p => `${p.label}(${p.sipseong}·${p.sipiunsung || '없음'})`)
    .join(', ')

  const currentYear = new Date().getFullYear()
  const birthYear = parseInt(birthDate.split('-')[0])
  const currentAge = currentYear - birthYear + 1 // 세는나이

  // 삼재(三災) 사전 계산
  const birthYearJiC = saju.yearPillar[1]
  const currentYearJiC = getYearJi(currentYear)
  const samjaeC = getSamjae(birthYearJiC, currentYearJiC)

  // 현재 연도 세운(歲運) 사전 계산
  const seunCalcC = calculateSaju(currentYear, 6, 15)
  const seunPillarC = seunCalcC.yearPillar
  const seunPillarHanjaC = seunCalcC.yearPillarHanja
  const seunSipseongC = getSipseong(saju.dayPillar[0], seunPillarC[0])

  // 세운 지지↔일지 충합 사전 계산 (AI 역법 오류 방지)
  const CHUNG_C: [string, string][] = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']]
  const YUKHAP_C: [string, string][] = [['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미']]
  const seunJiC = seunPillarC[1]
  const dayJiC = saju.dayPillar[1]
  const seunDayNoteC = CHUNG_C.some(([a,b]) => (seunJiC===a&&dayJiC===b)||(seunJiC===b&&dayJiC===a))
    ? `⚠️ 세운 지지(${seunJiC})↔일지(${dayJiC}): 충(冲) — 올해 이직·갈등·급변 주의, careerTimeline 현재 시기 score 추가 -8점`
    : YUKHAP_C.some(([a,b]) => (seunJiC===a&&dayJiC===b)||(seunJiC===b&&dayJiC===a))
    ? `✅ 세운 지지(${seunJiC})↔일지(${dayJiC}): 합(合) — 올해 인맥·기회·조직 안정, careerTimeline 현재 시기 score 추가 +6점`
    : `세운 지지(${seunJiC})↔일지(${dayJiC}): 충합 없음 — 중립 기조`

  // 신살별 커리어 가중치 동적 생성 (사용자에게 있는 신살만)
  const sinsalNames = detail.sinsal.map(s => s.name)
  const sinsalCareerLines: string[] = []
  if (sinsalNames.some(n => n.includes('역마살'))) sinsalCareerLines.push('⚡ 역마살(驛馬煞) 있음 → 20-30대 이직·이동 커리어, 다양한 경험 강점 → 해당 시기 score +5~+8 반영 필수')
  if (sinsalNames.some(n => n.includes('도화살'))) sinsalCareerLines.push('🌸 도화살(桃花煞) 있음 → 대인관계·미디어·서비스업 유리, 20-30대 score +5 반영 필수')
  if (sinsalNames.some(n => n.includes('화개살'))) sinsalCareerLines.push('🔮 화개살(華蓋煞) 있음 → 40-50대 전문화·독립운 강 → score +8, 종교·예술·학문 추천 필수')
  if (sinsalNames.some(n => n.includes('양인살'))) sinsalCareerLines.push('⚔️ 양인살(羊刃煞) 있음 → 30-40대 추진력 승부기 → score +10, 경쟁·도전 분야 반영 필수')
  if (sinsalNames.some(n => n.includes('백호대살') || n.includes('백호살'))) sinsalCareerLines.push('🐯 백호대살(白虎大煞) 있음 → 의료·법률·군경 강점, 위기 결단력 → 해당 분야 추천 필수')
  if (sinsalNames.some(n => n.includes('귀문관살'))) sinsalCareerLines.push('👁️ 귀문관살(鬼門關煞) 있음 → 직관·예술·상담·종교 직종 강점 → 해당 분야 추천 필수')
  if (detail.gongmang) sinsalCareerLines.push(`⬜ 공망(空亡): ${detail.gongmang[0]}·${detail.gongmang[1]} → 해당 지지 대운 시기 커리어 전환·공백 가능 → score -5 반영 필수`)
  const sinsalCareerNote = sinsalCareerLines.length > 0
    ? sinsalCareerLines.join('\n')
    : '- 커리어에 영향을 주는 신살 없음 → 격국·용신 기준만 반영'

  const userPrompt = `${birthDate}생 (현재 ${currentAge}세) 사용자의 사주 기반 직업·적성 분석을 해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

[사주 심층 분석 (코드 계산값 — 반드시 사용)]
- 일간: ${detail.dayMaster.name} (${detail.dayMaster.element}) — ${detail.dayMaster.trait}
- 신강/신약: ${detail.bodyStrength}
- 격국(格局): ${detail.geokguk}
- 강한 오행: ${detail.dominantElement} / 약한 오행: ${detail.weakElement}
- 십성 구성: ${sipseongList}
- 용신(用神): ${yongshin.yongshinFull} — ${yongshin.reason}
- 희신(喜神): ${yongshin.heungshin}
- 기신(忌神): ${yongshin.heukshin}
- 신살: ${detail.sinsal.length > 0 ? detail.sinsal.map(s => s.name).join(', ') : '없음'}

[직업 적성 분석 기준]
- 격국이 관성격(정관·편관)이면 조직·공직·전문직 적성
- 격국이 식상격(식신·상관)이면 창작·서비스·기술·표현 적성
- 격국이 재성격(정재·편재)이면 사업·금융·영업 적성
- 격국이 인성격(정인·편인)이면 학문·연구·교육·상담 적성
- 용신 오행별 현대 직업 매핑:
  · 목(木) 용신 → 교육·의료·환경·ESG·헬스케어·식품·출판·콘텐츠 기획
  · 화(火) 용신 → IT개발·AI·미디어·엔터테인먼트·광고·디자인·반도체·전기
  · 토(土) 용신 → 부동산·건설·인테리어·농업·식음료·지방행정·물류허브
  · 금(金) 용신 → 법률·회계·금융·컨설팅·제조·기계·국방·정밀기기
  · 수(水) 용신 → 무역·유통·물류·관광·호텔·수산·음료·해운·외교
- 십성 구성별 직업 적성:
  · 관성(官星) 강: 대기업·공기관·전문직(의사·변호사·회계사)·정치·군경
  · 식신(食神) 강: 요식업·콘텐츠크리에이터·예술·복지·의료보조
  · 상관(傷官) 강: 스타트업창업·크리에이티브·혁신기획·IT개발·예술
  · 재성(財星) 강: 부동산투자·무역·영업·사업·금융투자·유통
  · 인성(印星) 강: 학계·연구소·출판·상담·교육·종교·심리치료

[일간(日干) 천간별 고유 직업 적성 — 10간 세부 기준]
일간 특성을 격국·용신과 교차하여 적성 분석에 반드시 반영하세요:
- 甲木(갑목): 곧고 강직한 나무 → 교육·법조·건축·의료·환경·출판·NGO 리더·임업
- 乙木(을목): 유연한 풀과 덩굴 → 예술·미용·플로리스트·원예·상담·디자인·의류·식품
- 丙火(병화): 밝고 뜨거운 태양 → 방송·연예·마케팅·광고·에너지·전기·항공·무역
- 丁火(정화): 은은한 촛불 → 의료·간호·음식업·음악·상담·종교·조명디자인·약사
- 戊土(무토): 큰 산·대지 → 부동산·건설·토목·농업·숙박·산림관리·금융기관
- 己土(기토): 비옥한 정원 → 행정·인사관리·도자기·음식·보육·유아교육·복지
- 庚金(경금): 바위와 쇠 → 법률·군경·의료(외과·치과)·기계·제조·스포츠·단련
- 辛金(신금): 보석·귀금속 → 금융·회계·패션·피부과·귀금속·IT정밀기기·미용성형
- 壬水(임수): 큰 바다·강 → 무역·외교·해운·여행업·호텔·유통·물류·다국적기업
- 癸水(계수): 비·이슬 → 예술·음악·철학·심리치료·연구·카운슬링·사진·문학

[careerTimeline score 산정 기준 — 격국 기반 시기 강약]
- 관성격: 30대 중반~40대 관성 활성기에 피크(85-90점), 20대는 기반 구축기(60-70점)
- 식상격: 20대 후반~30대 창의·표현 활성기 높음(80-88점), 50대+ 재능 전수기도 높음
- 재성격: 30대 중반~40대 사업·자산 형성기 피크(85-90점), 20대는 씨앗기(55-65점)
- 인성격: 40대~50대 학문·상담 원숙기 피크(82-88점), 20대는 학습 집중기(70-75점)
- 신강 사주: 30-40대 추진력 절정, 독립·창업 유리한 시기 높게
- 신약 사주: 20-30대 성장 지원 환경 중요, 조직 내 역할 발휘 시기 높게
- 현재 나이(${currentAge}세) 기준: 현재가 어떤 시기인지 반드시 반영하여 score 산정

[이 사주의 신살별 커리어 타임라인 가중치 — 실제 적용 기준]
${sinsalCareerNote}

[${currentYear}년 세운(歲運) — 올해 커리어 기운]
- 세운 간지: ${seunPillarC}(${seunPillarHanjaC})
- 세운 천간 십성: 일간 ${saju.dayPillar[0]} 기준 세운 천간 ${seunPillarC[0]}는 → ${seunSipseongC}
  (세운 십성 의미를 careerTimeline·bestCareerPeriod에 반영하세요:
   편관년=도전·명예기회·승부, 정관년=안정·승진·조직 공인, 식신년=창의·아이디어·여유,
   상관년=혁신·이직충동·표현력 발휘, 인성년=학습·자격증·귀인, 재성년=사업기회·수익창출)
- 세운 지지↔일지 충합 (코드 계산값): ${seunDayNoteC}

삼재(三災): ${samjaeC.isSamjae ? `⚠️ ${samjaeC.type} — ${samjaeC.description}
  · 삼재 해에는 이직·창업·승진 도전 최소화 권장, careerTimeline 현재 시기 score -5~8점 하향
  · 들삼재: 직업 변동 위험 최고 / 눌삼재: 직장 내 갈등·침체 / 날삼재: 마무리·정리 후 새 출발
  · bestCareerPeriod·sideJobAdvice에 삼재 경고 문구 포함 필수` : '해당 없음'}

위 계산값과 세운·신살 가중치를 반영하여 적성 유형 · 추천 직군 · 업무 스타일 · 커리어 타임라인을 분석해주세요.
부업 적성과 피해야 할 분야도 포함해주세요.${daeunNote}

[${currentYear}년 월운 지지 십이운성 — 이달의 커리어 에너지 참고]
일간 ${dayGanC} 기준 각 달 월운 지지 십이운성:
${Array.from({ length: 12 }, (_, i) => {
  const m = i + 1
  const ms = (() => { try { return calculateSaju(currentYear, m, 20) } catch { return null } })()
  if (!ms) return null
  const ji = ms.monthPillar[1]
  const unsung = getSipiuUnsung(dayGanC, ji)
  const mark = unsung === '제왕' ? ' ★★★절정운' : unsung === '임관' ? ' ★★상승운' : ['장생', '관대'].includes(unsung) ? ' ★좋음' : ['묘', '절'].includes(unsung) ? ' ▼▼정체주의' : ['병', '사'].includes(unsung) ? ' ▼하향주의' : ''
  return `  · ${m}월(${ms.monthPillar}): 십이운성 ${unsung}${mark}`
}).filter(Boolean).join('\n')}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonText = content.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as CareerSajuResponse
  } catch {
    console.error('[CareerSaju] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
