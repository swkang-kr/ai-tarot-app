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
  LineChart,
  Line,
} from 'recharts'
import type { WealthSajuResponse } from '@/lib/ai/wealth-saju-prompt'

interface WealthSajuCardProps {
  analysis: WealthSajuResponse
  birthDate: string
}

const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function MonthTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-yellow-500/30 rounded-lg p-2 text-xs max-w-[140px]">
      <p className="text-yellow-300 font-bold">{MONTH_NAMES[d.month - 1]}</p>
      <p className="text-white font-bold">{d.score}점</p>
      <p className="text-yellow-200 mt-0.5">{d.tip}</p>
    </div>
  )
}

function TimelineTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-yellow-500/30 rounded-lg p-2 text-xs max-w-[130px]">
      <p className="text-yellow-300 font-bold">{d.period}</p>
      <p className="text-white font-semibold">{d.theme}</p>
      <p className="text-white/60 mt-0.5">{d.advice}</p>
      <p className="text-yellow-200 font-bold">{d.score}점</p>
    </div>
  )
}

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return '#fbbf24'
  if (score >= 65) return '#f59e0b'
  return '#d97706'
}

export default function WealthSajuCard({ analysis, birthDate }: WealthSajuCardProps) {
  const currentMonth = new Date().getMonth() + 1
  const bestMonth = analysis.monthlyWealthFlow.length > 0
    ? analysis.monthlyWealthFlow.reduce((a, b) => a.score > b.score ? a : b)
    : null

  const monthData = analysis.monthlyWealthFlow.map((m) => ({
    ...m,
    name: `${m.month}`,
    fill:
      m.month === bestMonth?.month
        ? '#fbbf24'
        : m.month === currentMonth
        ? '#f59e0b'
        : '#92400e',
  }))

  const timelineData = analysis.wealthTimeline.map((t) => ({
    ...t,
    fill: SCORE_COLOR(t.score),
  }))

  return (
    <div className="space-y-4">
      {/* 헤더 — 재물 유형 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-yellow-500/20 via-amber-500/15 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 3 }}
          className="text-5xl mb-2"
        >
          {analysis.wealthEmoji}
        </motion.div>
        <p className="text-yellow-300 text-xs font-medium mb-1">사주 재물 유형</p>
        <h3 className="text-white font-bold text-xl mb-2">{analysis.wealthType}</h3>
        <p className="text-white/75 text-sm leading-relaxed mb-3">{analysis.wealthSummary}</p>

        {/* 종합 재물운 점수 */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="text-4xl font-black text-yellow-300">{analysis.overallWealthScore}</div>
          <div className="text-left">
            <p className="text-yellow-400/70 text-[10px]">종합 재물운</p>
            <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden mt-0.5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${analysis.overallWealthScore}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          {analysis.keywords.map((kw, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-200 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 핵심 재물 정보 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        {[
          { icon: '💵', label: '수입 패턴', content: analysis.incomePattern, color: 'border-green-500/20 bg-green-500/10' },
          { icon: '📈', label: '투자 스타일', content: analysis.investmentStyle, color: 'border-blue-500/20 bg-blue-500/10' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className={`p-4 rounded-xl border ${item.color}`}
          >
            <p className="text-white/50 text-xs font-medium mb-1">{item.icon} {item.label}</p>
            <p className="text-white/80 text-sm leading-relaxed">{item.content}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* 재물 전성기 + 행운 자산 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/15 border border-yellow-400/20 rounded-2xl p-4 text-center">
          <p className="text-yellow-300 text-[10px] font-medium mb-1">⭐ 재물 전성기</p>
          <p className="text-white font-semibold text-sm leading-snug">{analysis.wealthPeakAge}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/15 border border-emerald-400/20 rounded-2xl p-4 text-center">
          <p className="text-emerald-300 text-[10px] font-medium mb-1">🍀 행운 자산</p>
          <p className="text-white/80 text-xs leading-snug">{analysis.luckyAsset}</p>
        </div>
      </motion.div>

      {/* 월별 재물 흐름 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">월별 재물운 흐름</h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthData} barCategoryGap="15%">
              <XAxis dataKey="name" tick={{ fill: '#fcd34d', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#fcd34d', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <ReferenceLine y={70} stroke="#ffffff15" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {monthData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40 justify-center">
          <span><span className="inline-block w-2 h-2 rounded bg-[#fbbf24] mr-1" />최고 달</span>
          <span><span className="inline-block w-2 h-2 rounded bg-[#f59e0b] mr-1" />현재 달</span>
        </div>
      </motion.div>

      {/* 월별 팁 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-3">월별 재물 팁</h4>
        <div className="grid grid-cols-2 gap-1.5">
          {analysis.monthlyWealthFlow.map((m, i) => (
            <motion.div
              key={m.month}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.03 }}
              className={`p-2 rounded-lg border ${
                m.month === currentMonth
                  ? 'bg-yellow-500/15 border-yellow-500/30'
                  : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-yellow-300 text-[10px] font-semibold">{MONTH_NAMES[m.month - 1]}</span>
                <span className="text-white/50 text-[10px]">{m.score}</span>
              </div>
              <p className="text-white/60 text-[10px] leading-snug">{m.tip}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 재물 타임라인 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">연령대별 재물 타임라인</h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData} barCategoryGap="20%">
              <XAxis dataKey="period" tick={{ fill: '#fcd34d', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#fcd34d', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<TimelineTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <ReferenceLine y={70} stroke="#ffffff15" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {timelineData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 저축 조언 + 주의사항 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-2"
      >
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-300 text-xs font-medium mb-1">🏦 저축·절약 조언</p>
          <p className="text-white/80 text-sm leading-relaxed">{analysis.savingAdvice}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-300 text-xs font-medium mb-1">⚠️ 재물 주의사항</p>
          <p className="text-white/80 text-sm leading-relaxed">{analysis.cautionPoints}</p>
        </div>
      </motion.div>
    </div>
  )
}
