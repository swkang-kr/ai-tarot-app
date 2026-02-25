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
} from 'recharts'
import type { DeepSajuResponse } from '@/lib/ai/deep-saju-prompt'

interface DeepSajuCardProps {
  analysis: DeepSajuResponse
  birthDate: string
}

const RATING_BAR_COLOR: Record<number, string> = {
  1: '#f87171',
  2: '#fb923c',
  3: '#facc15',
  4: '#60a5fa',
  5: '#4ade80',
}

function CycleTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-amber-500/30 rounded-lg p-2 text-xs max-w-[160px]">
      <p className="text-amber-300 font-bold">{d.period}</p>
      <p className="text-white font-semibold">{d.theme}</p>
      <p className="text-white/60 mt-0.5 leading-relaxed">{d.description}</p>
    </div>
  )
}

export default function DeepSajuCard({ analysis, birthDate }: DeepSajuCardProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-red-500/10 border border-amber-500/20 rounded-2xl p-6 text-center"
      >
        <div className="text-4xl mb-2">🏯</div>
        <h3 className="text-white font-bold text-lg mb-1">심층 사주 분석</h3>
        <p className="text-amber-300 text-xs">{birthDate} 생 · 命理 심층 리딩</p>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          {analysis.keywords.map((kw, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-amber-500/20 text-amber-200 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 삶의 큰 흐름 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🌊</span>
          <h4 className="text-white font-semibold text-sm">삶의 큰 흐름</h4>
        </div>
        <p className="text-purple-100 text-sm leading-relaxed">{analysis.lifePath}</p>
      </motion.div>

      {/* 성격 + 용신 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-3"
      >
        <div className="bg-white/10 backdrop-blur rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🧠</span>
            <h4 className="text-white font-semibold text-sm">성격 심층 분석</h4>
          </div>
          <p className="text-purple-100 text-sm leading-relaxed">{analysis.personality}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚡</span>
            <h4 className="text-amber-200 font-semibold text-sm">용신(喜神) 분석</h4>
          </div>
          <p className="text-amber-100 text-sm leading-relaxed">{analysis.yongshin}</p>
        </div>
      </motion.div>

      {/* 3개 패턴 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {[
          { icon: '💰', label: '재물운 패턴', text: analysis.wealthPattern, color: 'from-yellow-500/15' },
          { icon: '💕', label: '인연 패턴', text: analysis.lovePattern, color: 'from-pink-500/15' },
          { icon: '💼', label: '적성과 직업', text: analysis.careerDirection, color: 'from-blue-500/15' },
        ].map(({ icon, label, text, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} to-white/5 border border-white/10 rounded-2xl p-4`}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-lg">{icon}</span>
              <span className="text-white/80 text-xs font-medium">{label}</span>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">{text}</p>
          </div>
        ))}
      </motion.div>

      {/* 연령대별 대운 – BarChart 타임라인 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📅</span>
          <h4 className="text-white font-semibold text-sm">연령대별 대운(大運) 흐름</h4>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analysis.fortuneCycles.map((c) => ({
                ...c,
                value: c.rating * 20,
              }))}
              barCategoryGap="20%"
            >
              <XAxis
                dataKey="period"
                tick={{ fill: '#fde68a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#fde68a', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={22}
              />
              <Tooltip content={<CycleTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {analysis.fortuneCycles.map((cycle, i) => (
                  <Cell key={i} fill={RATING_BAR_COLOR[cycle.rating] ?? '#6366f1'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* 범례 */}
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {analysis.fortuneCycles.map((cycle, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px] text-white/60">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: RATING_BAR_COLOR[cycle.rating] }}
              />
              {cycle.period}: {cycle.theme}
            </div>
          ))}
        </div>
      </motion.div>

      {/* 올해 조언 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/20 rounded-2xl p-5 text-center"
      >
        <p className="text-purple-300 text-xs font-medium mb-2">🎯 올해의 핵심 메시지</p>
        <p className="text-white text-sm leading-relaxed font-medium">{analysis.thisYearAdvice}</p>
      </motion.div>
    </div>
  )
}
