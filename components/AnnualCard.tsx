'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import type { AnnualResponse } from '@/lib/ai/annual-prompt'
import { ScoreBar } from '@/components/ScoreChart'

interface AnnualCardProps {
  analysis: AnnualResponse
  targetYear: number
}

const FIELD_LABELS = [
  { key: 'love' as const, label: '❤️ 애정', color: '#f472b6' },
  { key: 'wealth' as const, label: '💰 재물', color: '#fbbf24' },
  { key: 'career' as const, label: '💼 커리어', color: '#60a5fa' },
  { key: 'health' as const, label: '🌿 건강', color: '#4ade80' },
]

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-purple-500/30 rounded-lg p-2 text-xs max-w-[160px]">
      <p className="text-purple-300 font-bold">{MONTH_NAMES[d.month - 1]}</p>
      <p className="text-white font-bold">{d.score}점</p>
      <p className="text-purple-200 mt-0.5">{d.theme}</p>
    </div>
  )
}

export default function AnnualCard({ analysis, targetYear }: AnnualCardProps) {
  const currentMonth = new Date().getMonth() + 1

  const chartData = analysis.months.map((m) => ({
    ...m,
    name: `${m.month}`,
    fill:
      m.month === analysis.bestMonth
        ? '#a78bfa'
        : m.month === analysis.worstMonth
        ? '#f87171'
        : m.month === currentMonth
        ? '#60a5fa'
        : '#6366f1',
  }))

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-sky-500/20 via-blue-500/20 to-indigo-500/20 border border-sky-500/20 rounded-2xl p-6 text-center"
      >
        <div className="text-4xl mb-2">📆</div>
        <h3 className="text-white font-bold text-lg mb-1">{targetYear}년 연간 운세</h3>
        <p className="text-sky-300 text-xs mb-3">12개월 전체 흐름 분석</p>
        <p className="text-white/80 text-sm leading-relaxed">{analysis.yearSummary}</p>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          {analysis.keywords.map((kw, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-sky-500/20 text-sky-200 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 핵심 달 하이라이트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          { icon: '⭐', label: '최고의 달', month: analysis.bestMonth, color: 'from-purple-500/20 border-purple-400/20' },
          { icon: '💕', label: '애정 피크', month: analysis.lovePeak, color: 'from-pink-500/20 border-pink-400/20' },
          { icon: '💰', label: '재물 피크', month: analysis.wealthPeak, color: 'from-yellow-500/20 border-yellow-400/20' },
        ].map(({ icon, label, month, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} to-white/5 border rounded-xl p-3 text-center`}>
            <span className="text-xl">{icon}</span>
            <p className="text-white/60 text-[10px] mt-1">{label}</p>
            <p className="text-white font-bold text-base">{MONTH_NAMES[month - 1]}</p>
          </div>
        ))}
      </motion.div>

      {/* 월별 점수 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">월별 운세 흐름</h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="15%">
              <XAxis dataKey="name" tick={{ fill: '#a78bfa', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#a78bfa', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <ReferenceLine y={70} stroke="#ffffff15" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40 justify-center">
          <span><span className="inline-block w-2 h-2 rounded bg-[#a78bfa] mr-1" />최고의 달</span>
          <span><span className="inline-block w-2 h-2 rounded bg-[#60a5fa] mr-1" />현재 달</span>
          <span><span className="inline-block w-2 h-2 rounded bg-[#f87171] mr-1" />주의 달</span>
        </div>
      </motion.div>

      {/* 월별 상세 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">월별 상세 운세</h4>
        <div className="space-y-2">
          {analysis.months.map((month, i) => {
            const isBest = month.month === analysis.bestMonth
            const isWorst = month.month === analysis.worstMonth
            const isCurrent = month.month === currentMonth
            return (
              <motion.div
                key={month.month}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.04 }}
                className={`p-3 rounded-xl border ${
                  isBest
                    ? 'bg-purple-500/15 border-purple-500/30'
                    : isWorst
                    ? 'bg-red-500/10 border-red-500/20'
                    : isCurrent
                    ? 'bg-blue-500/15 border-blue-500/30'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 text-center">
                    <p className="text-white font-bold text-sm">{MONTH_NAMES[month.month - 1]}</p>
                    {isBest && <span className="text-[10px] text-purple-300">최고</span>}
                    {isWorst && <span className="text-[10px] text-red-300">주의</span>}
                    {isCurrent && !isBest && !isWorst && <span className="text-[10px] text-blue-300">현재</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white/80 text-xs font-medium">{month.theme}</span>
                      <span className="text-white/60 text-xs ml-auto">{month.score}점</span>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">{month.summary}</p>
                    <p className="text-purple-400/60 text-[10px] mt-1">길일: {month.luckyDay}</p>
                  </div>
                </div>
                {/* 분야별 점수 */}
                {month.fieldScores && (
                  <div className="mt-2.5 space-y-1 pl-14">
                    {FIELD_LABELS.map((f, fi) => (
                      <ScoreBar
                        key={f.key}
                        label={f.label}
                        score={month.fieldScores[f.key] ?? 0}
                        color={f.color}
                        delay={0.4 + i * 0.04 + fi * 0.03}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* 연간 조언 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-400/20 rounded-2xl p-5 text-center"
      >
        <p className="text-sky-300 text-xs font-medium mb-2">🎯 {targetYear}년 핵심 메시지</p>
        <p className="text-white text-sm leading-relaxed font-medium">{analysis.annualAdvice}</p>
      </motion.div>
    </div>
  )
}
