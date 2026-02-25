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
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts'
import type { ManseryeokResponse } from '@/lib/ai/manseryeok-prompt'

interface ManseryeokCardProps {
  analysis: ManseryeokResponse
  targetYear: number
}

const DECADE_COLOR = (score: number) => {
  if (score >= 85) return '#4ade80'
  if (score >= 70) return '#60a5fa'
  if (score >= 55) return '#facc15'
  return '#f87171'
}

const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function MonthTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-teal-500/30 rounded-lg p-2 text-xs max-w-[160px]">
      <p className="text-teal-300 font-bold">{MONTH_NAMES[d.month - 1]}</p>
      <p className="text-white font-bold">{d.score}점</p>
      <p className="text-white/60 mt-0.5 leading-relaxed">{d.ganji}월</p>
      <p className="text-teal-200 mt-0.5">{d.advice}</p>
    </div>
  )
}

function DecadeTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-teal-500/30 rounded-lg p-2 text-xs max-w-[140px]">
      <p className="text-teal-300 font-bold">{d.decade}</p>
      <p className="text-white font-semibold">{d.theme}</p>
      <p className="text-white/50 text-[10px] mt-0.5">{d.ganji}</p>
      <p className="text-teal-200 font-bold">{d.score}점</p>
    </div>
  )
}

export default function ManseryeokCard({ analysis, targetYear }: ManseryeokCardProps) {
  const currentMonth = new Date().getMonth() + 1

  const monthData = analysis.monthlyFlow.map((m) => ({
    ...m,
    name: `${m.month}`,
    fill: m.month === currentMonth ? '#2dd4bf' : '#0d9488',
  }))

  const decadeData = analysis.lifeTimeline.map((d) => ({
    ...d,
    fill: DECADE_COLOR(d.score),
  }))

  return (
    <div className="space-y-4">
      {/* 헤더 — 세운 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-teal-500/20 via-cyan-500/15 to-emerald-500/10 border border-teal-500/20 rounded-2xl p-6 text-center"
      >
        <div className="text-4xl mb-2">📜</div>
        <h3 className="text-white font-bold text-lg mb-1">만세력 분석</h3>
        <p className="text-teal-300 text-xs mb-3">대운·세운·월운 타임라인</p>
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="text-center">
            <p className="text-teal-300 text-xs">세운</p>
            <p className="text-white font-bold">{analysis.currentSeun.ganji}</p>
          </div>
          <div className="text-white/30 text-2xl">·</div>
          <div className="text-center">
            <p className="text-teal-300 text-xs">테마</p>
            <p className="text-white font-bold text-sm">{analysis.currentSeun.theme}</p>
          </div>
          <div className="text-white/30 text-2xl">·</div>
          <div className="text-center">
            <p className="text-teal-300 text-xs">점수</p>
            <p className="text-white font-bold">{analysis.currentSeun.score}점</p>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">{analysis.currentSeun.advice}</p>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          {analysis.keywords.map((kw, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-teal-500/20 text-teal-200 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 대운 — 현재 + 다음 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {[
          { label: '현재 대운', data: analysis.currentDaeun, color: 'from-teal-500/20 border-teal-400/30', text: 'text-teal-300' },
          { label: '다음 대운', data: analysis.nextDaeun, color: 'from-cyan-500/20 border-cyan-400/20', text: 'text-cyan-300' },
        ].map(({ label, data, color, text }) => (
          <div key={label} className={`bg-gradient-to-br ${color} to-white/5 border rounded-2xl p-4`}>
            <p className={`${text} text-xs font-medium mb-1`}>{label}</p>
            <p className="text-white font-bold text-lg">{data.ganji}</p>
            <p className="text-white/50 text-[10px] mb-2">{data.period}</p>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full bg-teal-400"
                initial={{ width: 0 }}
                animate={{ width: `${data.score}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <p className="text-white/60 text-[10px] leading-relaxed">{data.meaning}</p>
          </div>
        ))}
      </motion.div>

      {/* 월운 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">{targetYear}년 월운 흐름</h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthData} barCategoryGap="15%">
              <XAxis dataKey="name" tick={{ fill: '#5eead4', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5eead4', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <ReferenceLine y={70} stroke="#ffffff15" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {monthData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40 justify-center">
          <span><span className="inline-block w-2 h-2 rounded bg-[#2dd4bf] mr-1" />현재 달</span>
          <span><span className="inline-block w-2 h-2 rounded bg-[#0d9488] mr-1" />일반</span>
        </div>
      </motion.div>

      {/* 월운 상세 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-3">월운 상세</h4>
        <div className="grid grid-cols-2 gap-2">
          {analysis.monthlyFlow.map((m, i) => (
            <motion.div
              key={m.month}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.04 }}
              className={`p-2.5 rounded-xl border ${
                m.month === currentMonth
                  ? 'bg-teal-500/15 border-teal-500/30'
                  : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-semibold text-xs">{MONTH_NAMES[m.month - 1]}</span>
                <span className="text-teal-300 text-xs">{m.score}점</span>
              </div>
              <p className="text-white/40 text-[10px]">{m.ganji}월</p>
              <p className="text-white/60 text-[10px] mt-0.5 leading-relaxed line-clamp-2">{m.advice}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 전 생애 대운 타임라인 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">전 생애 대운 타임라인</h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={decadeData} barCategoryGap="20%">
              <XAxis dataKey="decade" tick={{ fill: '#5eead4', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5eead4', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<DecadeTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <ReferenceLine y={70} stroke="#ffffff15" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {decadeData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {[
            { color: '#4ade80', label: '최상(85+)' },
            { color: '#60a5fa', label: '양호(70+)' },
            { color: '#facc15', label: '보통(55+)' },
            { color: '#f87171', label: '주의(~54)' },
          ].map(({ color, label }) => (
            <span key={label} className="text-[10px] text-white/40 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
