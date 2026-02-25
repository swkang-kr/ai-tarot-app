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
import type { NewYearResponse } from '@/lib/ai/new-year-prompt'

interface NewYearCardProps {
  analysis: NewYearResponse
  targetYear: number
}

const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const ADVICE_FIELDS = [
  { key: 'love' as const, icon: '❤️', label: '애정운', color: '#f472b6' },
  { key: 'wealth' as const, icon: '💰', label: '재물운', color: '#fbbf24' },
  { key: 'career' as const, icon: '💼', label: '직업·학업운', color: '#60a5fa' },
  { key: 'health' as const, icon: '🌿', label: '건강운', color: '#4ade80' },
]

function MonthTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-red-500/30 rounded-lg p-2 text-xs max-w-[160px]">
      <p className="text-red-300 font-bold">{MONTH_NAMES[d.month - 1]}</p>
      <p className="text-white font-bold">{d.score}점</p>
      <p className="text-white/70 mt-0.5">{d.event}</p>
      <p className="text-red-200 text-[10px] mt-0.5">→ {d.action}</p>
    </div>
  )
}

export default function NewYearCard({ analysis, targetYear }: NewYearCardProps) {
  const currentMonth = new Date().getMonth() + 1
  const bestMonth = analysis.monthHighlights.length > 0
    ? analysis.monthHighlights.reduce((a, b) => a.score > b.score ? a : b)
    : null
  const worstMonth = analysis.monthHighlights.length > 0
    ? analysis.monthHighlights.reduce((a, b) => a.score < b.score ? a : b)
    : null

  const chartData = analysis.monthHighlights.map((m) => ({
    ...m,
    name: `${m.month}`,
    fill:
      m.month === bestMonth?.month
        ? '#f87171'
        : m.month === currentMonth
        ? '#fb923c'
        : '#dc2626',
  }))

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-red-500/20 via-rose-500/15 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
          className="text-4xl mb-2"
        >
          🎊
        </motion.div>
        <p className="text-red-300 text-xs font-medium mb-1">{analysis.zodiacSign}</p>
        <h3 className="text-white font-bold text-xl mb-1">{targetYear}년 신년운세</h3>
        <p className="text-rose-200/60 text-xs mb-3">{analysis.yearGodBless}</p>

        {/* 종합 점수 */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="text-3xl font-black text-white">{analysis.overallScore}</div>
          <div className="text-left">
            <div className="text-red-300 text-[10px]">종합 운세 점수</div>
            <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden mt-0.5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${analysis.overallScore}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        </div>

        <p className="text-white/80 text-sm leading-relaxed">{analysis.yearSummary}</p>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          {analysis.keywords.map((kw, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-red-500/20 text-red-200 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 월별 하이라이트 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">월별 운세 흐름</h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="15%">
              <XAxis dataKey="name" tick={{ fill: '#fca5a5', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#fca5a5', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
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
          <span><span className="inline-block w-2 h-2 rounded bg-[#f87171] mr-1" />최고의 달</span>
          <span><span className="inline-block w-2 h-2 rounded bg-[#fb923c] mr-1" />현재 달</span>
        </div>
      </motion.div>

      {/* 월별 이벤트 상세 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-3">월별 핵심 이벤트</h4>
        <div className="space-y-2">
          {analysis.monthHighlights.map((m, i) => {
            const isBest = m.month === bestMonth?.month
            const isCurrent = m.month === currentMonth
            return (
              <motion.div
                key={m.month}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.04 }}
                className={`p-3 rounded-xl border ${
                  isBest
                    ? 'bg-red-500/15 border-red-500/30'
                    : isCurrent
                    ? 'bg-orange-500/15 border-orange-500/30'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="w-9 flex-shrink-0 text-center">
                    <p className="text-white font-bold text-xs">{MONTH_NAMES[m.month - 1]}</p>
                    <p className="text-white/50 text-[9px]">{m.score}점</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-white/80 text-xs font-medium">{m.event}</p>
                    <p className="text-red-300/70 text-[10px] mt-0.5">→ {m.action}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* 4대 분야 운세 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        {ADVICE_FIELDS.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + i * 0.08 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{f.icon}</span>
              <span className="text-white/60 text-xs font-medium">{f.label}</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{analysis.fourPillarsAdvice[f.key]}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* 행운 아이템 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-3">올해의 행운 아이템</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '행운 색상', value: analysis.luckyItems.color, icon: '🎨' },
            { label: '행운 숫자', value: String(analysis.luckyItems.number), icon: '🔢' },
            { label: '길한 방위', value: analysis.luckyItems.direction, icon: '🧭' },
            { label: '기운 음식', value: analysis.luckyItems.food, icon: '🍽️' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
              <span className="text-xl">{icon}</span>
              <p className="text-white/40 text-[10px] mt-1 mb-0.5">{label}</p>
              <p className="text-white font-semibold text-xs leading-snug">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 올해의 좌우명 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/20 rounded-2xl p-5 text-center"
      >
        <p className="text-red-300 text-xs font-medium mb-2">🎊 {targetYear}년 나의 슬로건</p>
        <p className="text-white text-lg font-bold">{analysis.yearMantra}</p>
      </motion.div>
    </div>
  )
}
