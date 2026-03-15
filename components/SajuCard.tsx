'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SajuInfo } from '@/lib/utils/saju'
import { getElement, getDetailedAnalysis } from '@/lib/utils/saju'

interface SajuCardProps {
  saju: SajuInfo
  analysis?: string | null
}

const ELEMENT_COLOR: Record<string, string> = {
  '목(木)': 'from-green-500 to-emerald-600',
  '화(火)': 'from-red-500 to-orange-500',
  '토(土)': 'from-yellow-600 to-amber-600',
  '금(金)': 'from-gray-300 to-slate-400',
  '수(水)': 'from-blue-500 to-indigo-500',
}

const ELEMENT_BG: Record<string, string> = {
  '목(木)': 'bg-green-500/20 border-green-500/30',
  '화(火)': 'bg-red-500/20 border-red-500/30',
  '토(土)': 'bg-yellow-500/20 border-yellow-500/30',
  '금(金)': 'bg-gray-400/20 border-gray-400/30',
  '수(水)': 'bg-blue-500/20 border-blue-500/30',
}

const ELEMENT_BAR_COLOR: Record<string, string> = {
  '목(木)': 'bg-green-500',
  '화(火)': 'bg-red-500',
  '토(土)': 'bg-yellow-500',
  '금(金)': 'bg-gray-400',
  '수(水)': 'bg-blue-500',
}

export default function SajuCard({ saju, analysis }: SajuCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const detailed = getDetailedAnalysis(saju)

  const pillars = [
    { label: '시주(時)', hangul: saju.hourPillar, hanja: saju.hourPillarHanja },
    { label: '일주(日)', hangul: saju.dayPillar, hanja: saju.dayPillarHanja },
    { label: '월주(月)', hangul: saju.monthPillar, hanja: saju.monthPillarHanja },
    { label: '년주(年)', hangul: saju.yearPillar, hanja: saju.yearPillarHanja },
  ]

  const maxCount = Math.max(...detailed.elementBalance.map(e => e.count), 1)

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl">
      <h2 className="text-lg font-bold text-white mb-1 text-center">
        🏯 사주팔자
      </h2>
      <p className="text-purple-300 text-xs text-center mb-5">
        음력 {saju.lunarYear}년 {saju.isLeapMonth ? '윤' : ''}{saju.lunarMonth}월 {saju.lunarDay}일
      </p>

      {/* 사주 4주 그리드 */}
      <div className="grid grid-cols-4 gap-2">
        {pillars.map((p, i) => {
          const element = p.hangul ? getElement(p.hangul) : ''
          const colorClass = ELEMENT_BG[element] || 'bg-white/5 border-white/10'

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl border p-3 text-center ${colorClass}`}
            >
              <p className="text-purple-300 text-[10px] mb-2">{p.label}</p>
              {p.hangul ? (
                <>
                  <div className="text-white text-xl font-bold leading-tight">
                    {p.hangul[0]}
                  </div>
                  <div className="text-purple-200 text-[10px] mb-1">
                    {p.hanja?.[0]}
                  </div>
                  <div className="text-white text-xl font-bold leading-tight">
                    {p.hangul[1]}
                  </div>
                  <div className="text-purple-200 text-[10px] mb-1">
                    {p.hanja?.[1]}
                  </div>
                  {element && (
                    <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r ${ELEMENT_COLOR[element] || ''} text-white`}>
                      {element}
                    </span>
                  )}
                </>
              ) : (
                <div className="text-purple-400 text-sm py-4">미입력</div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* 일간(Day Master) 요약 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10"
      >
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold text-white">
            일간: {detailed.dayMaster.name}({detailed.dayMaster.element})
          </span>
          <span className="text-xs text-purple-300">
            {detailed.dayMaster.trait}
          </span>
          {detailed.bodyStrength && detailed.bodyStrength !== '중화(中和)' && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              detailed.bodyStrength === '신강(身强)'
                ? 'bg-orange-500/30 text-orange-300'
                : detailed.bodyStrength === '신약(身弱)'
                ? 'bg-blue-500/30 text-blue-300'
                : 'bg-green-500/30 text-green-300'
            }`}>
              {detailed.bodyStrength}
            </span>
          )}
        </div>
        <p className="text-white/70 text-xs leading-relaxed">
          {detailed.dayMaster.description}
        </p>
      </motion.div>

      {/* 오행 균형 바 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4"
      >
        <h3 className="text-sm font-semibold text-purple-200 mb-2">⚖️ 오행 균형</h3>
        <div className="space-y-1.5">
          {detailed.elementBalance.map((el) => (
            <div key={el.name} className="flex items-center gap-2">
              <span className="text-xs w-14 text-right text-white/70">
                {el.emoji} {el.name.slice(0, 1)}
              </span>
              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(el.count / maxCount) * 100}%` }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className={`h-full rounded-full ${ELEMENT_BAR_COLOR[el.name] || 'bg-purple-500'}`}
                />
              </div>
              <span className="text-xs w-4 text-white/50">{el.count}</span>
            </div>
          ))}
        </div>
        <p className="text-white/50 text-[10px] mt-2">{detailed.summary}</p>
      </motion.div>

      {/* 신살(神煞) */}
      {detailed.sinsal && detailed.sinsal.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="mt-4 space-y-1.5"
        >
          <h3 className="text-sm font-semibold text-purple-200 mb-2">✨ 신살(神煞)</h3>
          {detailed.sinsal.map((sal, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border bg-violet-500/15 border-violet-500/30">
              <span className="text-xs font-bold flex-shrink-0 text-violet-300">{sal.name.split('(')[0]}</span>
              <div className="min-w-0">
                <p className="text-[10px] text-violet-400 mb-0.5">{sal.pillars.join('·')}에 위치</p>
                <p className="text-xs text-white/70 leading-relaxed">{sal.meaning}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* 형·충·합·해·파 특수 관계 */}
      {detailed.specialRelations && detailed.specialRelations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-4 space-y-1.5"
        >
          <h3 className="text-sm font-semibold text-purple-200 mb-2">⚡ 형·충·합·해·파</h3>
          {detailed.specialRelations.map((rel, i) => {
            const typeColors: Record<string, string> = {
              '충(冲)': 'bg-red-500/20 text-red-300 border-red-500/30',
              '합(合)': 'bg-green-500/20 text-green-300 border-green-500/30',
              '형(刑)': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
              '해(害)': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
              '파(破)': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            }
            const colorClass = typeColors[rel.type] || 'bg-white/10 text-white/70 border-white/10'
            return (
              <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${colorClass}`}>
                <span className="text-xs font-bold flex-shrink-0">{rel.type}</span>
                <span className="text-xs leading-relaxed">{rel.meaning}</span>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* 격국(格局) */}
      {detailed.geokguk && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.57 }}
          className="mt-4"
        >
          <h3 className="text-sm font-semibold text-purple-200 mb-2">🎯 격국(格局)</h3>
          <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-indigo-500/15 border-indigo-500/30">
            <span className="text-xs font-bold flex-shrink-0 text-indigo-300">{detailed.geokguk}</span>
            <p className="text-xs text-white/70 leading-relaxed">
              사주의 기본 틀로, 일간의 성향과 삶의 방향을 결정하는 핵심 구조입니다.
            </p>
          </div>
        </motion.div>
      )}

      {/* 공망(空亡) */}
      {detailed.gongmangPillars && detailed.gongmangPillars.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.58 }}
          className="mt-4"
        >
          <h3 className="text-sm font-semibold text-purple-200 mb-2">🕳️ 공망(空亡)</h3>
          <div className="space-y-1.5">
            {detailed.gongmangPillars.map((gp, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border bg-slate-500/15 border-slate-500/30">
                <span className="text-xs font-bold flex-shrink-0 text-slate-300">{gp.label} {gp.ji}</span>
                <p className="text-xs text-white/70 leading-relaxed">{gp.meaning}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI 사주 분석 */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20"
        >
          <h3 className="text-sm font-semibold text-purple-200 mb-2">
            🔮 AI 사주 분석
          </h3>
          <p className="text-white/80 text-sm leading-relaxed">
            {analysis}
          </p>
        </motion.div>
      )}

      {/* 상세보기 토글 */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="w-full mt-4 text-xs text-purple-300 hover:text-white transition py-2"
      >
        {showDetail ? '▲ 상세 접기' : '▼ 상세 해석 보기'}
      </button>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* 각 주 상세 해석 */}
            <div className="space-y-3 mt-2">
              {detailed.pillarsDetail.map((p, i) => (
                p.hangul && (
                  <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-white">{p.label}</span>
                      <span className="text-xs text-purple-300">{p.hangul} ({p.hanja})</span>
                      {p.element && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r ${ELEMENT_COLOR[p.element] || ''} text-white`}>
                          {p.element}
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-[11px] leading-relaxed">
                      <span className="text-purple-300">천간</span> {p.cheonganMeaning}
                    </p>
                    <p className="text-white/60 text-[11px] leading-relaxed mt-0.5">
                      <span className="text-purple-300">지지</span> {p.jijiMeaning}
                    </p>
                    {p.sipseong && p.sipseong !== '일간(日干)' && (
                      <p className="text-white/60 text-[11px] leading-relaxed mt-0.5">
                        <span className="text-yellow-400">십성</span> {p.sipseong}
                      </p>
                    )}
                    {p.sipiunsung && (
                      <p className="text-white/60 text-[11px] leading-relaxed mt-0.5">
                        <span className="text-cyan-400">십이운성</span> {p.sipiunsung}
                      </p>
                    )}
                  </div>
                )
              ))}
            </div>

            {/* 상생/상극 관계 */}
            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/5">
              <h4 className="text-xs font-semibold text-purple-200 mb-2">🔄 오행 관계</h4>
              <div className="space-y-1">
                {detailed.relationships.map((rel, i) => (
                  <p key={i} className="text-white/60 text-[11px]">{rel}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
