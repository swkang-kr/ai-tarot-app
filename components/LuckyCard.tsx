'use client'

import { motion } from 'framer-motion'
import { ScoreCircle } from './ScoreChart'
import type { LuckyInfo } from '@/lib/utils/lucky'
import { ELEMENT_LUCKY_COLOR } from '@/lib/utils/lucky'

interface LuckyCardProps {
  luckyInfo: LuckyInfo
  birthDateStr: string
}

const ELEMENT_NAME: Record<string, string> = {
  '목': '木 나무', '화': '火 불', '토': '土 흙', '금': '金 금', '수': '水 물',
}

export default function LuckyCard({ luckyInfo, birthDateStr }: LuckyCardProps) {
  const { color, direction, food, luckyNumber, luckyHour, score, boostElement, baseElement, todayElement } = luckyInfo

  const today = new Date()
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* 헤더 카드 */}
      <div
        className="rounded-3xl p-6 shadow-2xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color.hex}33, ${color.hex}11), rgba(255,255,255,0.08)` }}
      >
        {/* 배경 글로우 */}
        <div
          className="absolute inset-0 opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle at 60% 40%, ${color.hex}, transparent 70%)` }}
        />

        <div className="relative flex items-center gap-5">
          <div className="flex-shrink-0">
            <ScoreCircle score={score} size={88} strokeWidth={5} textClass="text-xl" transitionDelay={0.4} />
            <p className="text-center text-white/60 text-[10px] mt-1">행운 점수</p>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{color.emoji}</span>
              <h2 className="text-lg font-bold text-white">{dateLabel} 행운</h2>
            </div>
            <p className="text-white/70 text-xs mb-3">{birthDateStr} 생 · {ELEMENT_NAME[baseElement]} 일간</p>

            {/* 오늘의 행운 오행 */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: `${color.hex}44`, color: color.hex }}
            >
              <span>{color.emoji}</span>
              <span>행운 오행: {ELEMENT_NAME[boostElement]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 핵심 정보 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 행운의 색 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white/10 backdrop-blur rounded-2xl p-4 flex flex-col items-center gap-2"
        >
          <div
            className="w-10 h-10 rounded-full shadow-lg border-2 border-white/20 flex items-center justify-center text-xl"
            style={{ background: color.hex }}
          >
            {color.emoji}
          </div>
          <div className="text-center">
            <p className="text-white font-medium text-sm">{color.name}</p>
            <p className="text-white/50 text-[10px]">행운의 색</p>
          </div>
        </motion.div>

        {/* 행운의 방위 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur rounded-2xl p-4 flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-2xl">
            {direction.emoji}
          </div>
          <div className="text-center">
            <p className="text-white font-medium text-sm">{direction.name}</p>
            <p className="text-white/50 text-[10px]">행운의 방위</p>
          </div>
        </motion.div>

        {/* 행운의 숫자 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white/10 backdrop-blur rounded-2xl p-4 flex flex-col items-center gap-2"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ background: `${color.hex}66` }}
          >
            {luckyNumber}
          </div>
          <div className="text-center">
            <p className="text-white font-medium text-sm">{luckyNumber}번</p>
            <p className="text-white/50 text-[10px]">행운의 숫자</p>
          </div>
        </motion.div>
      </div>

      {/* 행운의 시간 & 음식 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-4 space-y-3"
      >
        <h3 className="text-white/80 text-xs font-semibold uppercase tracking-wide">오늘의 행운 아이템</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-white text-sm font-medium">{luckyHour}</p>
              <p className="text-white/50 text-[10px]">행운의 시간</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
            <span className="text-2xl">🍽️</span>
            <div>
              <p className="text-white text-sm font-medium">{food}</p>
              <p className="text-white/50 text-[10px]">행운의 음식</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 오늘의 일진 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/5 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{ELEMENT_LUCKY_COLOR[todayElement]?.emoji ?? '✨'}</span>
            <div>
              <p className="text-white/80 text-xs font-semibold">오늘 일진</p>
              {'todayIljin' in luckyInfo && (
                <p className="text-white font-bold text-sm">{(luckyInfo as LuckyInfo & { todayIljin: string }).todayIljin}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-xs font-medium">내 일간 오행</p>
            <p className="text-white/60 text-xs">{ELEMENT_NAME[baseElement]}</p>
          </div>
        </div>
        {'todayIljinMeaning' in luckyInfo && (
          <p className="text-white/60 text-[11px] leading-relaxed">
            {(luckyInfo as LuckyInfo & { todayIljinMeaning: string }).todayIljinMeaning}
          </p>
        )}
        <p className="text-white/40 text-[11px] mt-1.5 leading-relaxed">
          {color.desc} · 오늘은 {color.name} 계열의 물건이나 공간에서 행운이 찾아옵니다.
        </p>
      </motion.div>
    </motion.div>
  )
}
