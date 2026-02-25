'use client'

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { HistoryAnalysisResponse } from '@/lib/ai/history-prompt'

interface HistoryAnalysisCardProps {
  analysis: HistoryAnalysisResponse
  readingCount: number
}

const TREND_ICON: Record<string, string> = {
  상승: '📈',
  하락: '📉',
  유지: '➡️',
}

const TREND_COLOR: Record<string, string> = {
  상승: 'text-green-300',
  하락: 'text-red-300',
  유지: 'text-blue-300',
}

const SCORE_BARS = [
  { key: 'overall', label: '전체운', color: '#a78bfa' },
  { key: 'love', label: '애정운', color: '#f472b6' },
  { key: 'wealth', label: '재물운', color: '#fbbf24' },
  { key: 'health', label: '건강운', color: '#34d399' },
  { key: 'career', label: '커리어', color: '#60a5fa' },
] as const

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-purple-500/30 rounded-lg p-2 text-xs">
      <p className="text-purple-300 font-medium">{d.label}</p>
      <p className="text-white font-bold">{d.avg}점</p>
    </div>
  )
}

export default function HistoryAnalysisCard({ analysis, readingCount }: HistoryAnalysisCardProps) {
  const chartData = SCORE_BARS.map(({ key, label }) => ({
    label,
    avg: analysis.scoreTrends[key].avg,
    fill: '#a78bfa',
  }))

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-indigo-500/20 border border-purple-500/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📊</span>
          <h3 className="text-white font-bold text-base">운세 패턴 분석</h3>
          <span className="ml-auto text-purple-300 text-xs bg-white/10 px-2 py-0.5 rounded-full">
            최근 {readingCount}회
          </span>
        </div>
        <p className="text-purple-100 text-sm leading-relaxed">{analysis.periodSummary}</p>

        {/* 키워드 */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {analysis.dominantKeywords.map((kw, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full"
            >
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 분야별 트렌드 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">분야별 평균 점수 & 트렌드</h4>
        <div className="space-y-3">
          {SCORE_BARS.map(({ key, label, color }) => {
            const trend = analysis.scoreTrends[key]
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-white/70 text-xs w-14 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${trend.avg}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <span className="text-white text-xs w-8 text-right font-medium">{trend.avg}</span>
                <span className={`text-xs ${TREND_COLOR[trend.trend]} flex-shrink-0`}>
                  {TREND_ICON[trend.trend]} {trend.trend}
                </span>
              </div>
            )
          })}
        </div>

        {/* 미니 차트 */}
        <div className="mt-4 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="label" tick={{ fill: '#a78bfa', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#a78bfa', fontSize: 9 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={50} stroke="#ffffff20" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="avg" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 패턴 분석 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔍</span>
          <h4 className="text-white font-semibold text-sm">발견된 패턴</h4>
        </div>
        <p className="text-purple-100 text-sm leading-relaxed">{analysis.patternAnalysis}</p>
      </motion.div>

      {/* 최고 시기 + 조언 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
          <p className="text-green-300 text-xs font-medium mb-1">⭐ 최고 시기</p>
          <p className="text-white text-xs leading-relaxed">{analysis.bestPeriodDesc}</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
          <p className="text-purple-300 text-xs font-medium mb-1">💡 앞으로의 방향</p>
          <p className="text-white text-xs leading-relaxed">{analysis.advice}</p>
        </div>
      </motion.div>
    </div>
  )
}
