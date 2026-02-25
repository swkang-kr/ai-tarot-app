'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { ScoreCircle, ScoreBar } from '@/components/ScoreChart'

interface Scores {
  overall: number
  love: number
  wealth: number
  health: number
  career: number
}

interface TimeOfDay {
  morning: string
  afternoon: string
  evening: string
}

interface LuckyItems {
  color: string
  colorName: string
  number: number
  food: string
  direction: string
  activity: string
}

interface TarotCardProps {
  reading: {
    created_at: string
    keywords: string[]
    overall: string
    love: string
    wealth: string
    health?: string | null
    career?: string | null
    advice?: string | null
    lucky_color: string
    lucky_number: number
    scores?: Scores | null
    time_of_day?: TimeOfDay | null
    lucky_items?: LuckyItems | null
    warning?: string | null
  }
}

const sectionVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 },
  }),
}


export default function TarotCard({ reading }: TarotCardProps) {
  const [particles, setParticles] = useState<Array<{ width: string; height: string; top: string; left: string }>>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, () => ({
        width: `${Math.random() * 4 + 2}px`,
        height: `${Math.random() * 4 + 2}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
      }))
    )
  }, [])

  const sections = [
    { icon: '✨', title: '전체운', content: reading.overall, color: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/20' },
    { icon: '💖', title: '애정운', content: reading.love, color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/20' },
    { icon: '💰', title: '재물운', content: reading.wealth, color: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/20' },
    ...(reading.health ? [{ icon: '💪', title: '건강운', content: reading.health, color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/20' }] : []),
    ...(reading.career ? [{ icon: '💼', title: '직장/학업운', content: reading.career, color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20' }] : []),
  ]

  const luckyColor = reading.lucky_items?.color || reading.lucky_color
  const luckyColorName = reading.lucky_items?.colorName
  const luckyNumber = reading.lucky_items?.number ?? reading.lucky_number

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
      {/* 헤더 */}
      <div
        className="relative p-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${luckyColor}33 0%, #312e8166 50%, ${luckyColor}22 100%)`,
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((style, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={style}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="text-5xl mb-3">🔮</div>
          <p className="text-purple-200 text-sm mb-4">
            {format(new Date(reading.created_at), 'yyyy년 M월 d일 EEEE', { locale: ko })}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {reading.keywords.map((keyword: string, idx: number) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="px-4 py-1.5 bg-white/15 backdrop-blur-sm text-white rounded-full text-sm font-medium border border-white/20"
              >
                {keyword}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 종합운 점수 + 카테고리 점수 */}
      {reading.scores && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-6 -mt-6 relative z-10"
        >
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center shrink-0">
                <p className="text-xs text-purple-300 mb-1">종합운</p>
                <ScoreCircle score={reading.scores.overall} />
              </div>
              <div className="flex-1 space-y-2">
                <ScoreBar label="💖 애정" score={reading.scores.love} color="#f472b6" delay={0.3} />
                <ScoreBar label="💰 재물" score={reading.scores.wealth} color="#fbbf24" delay={0.4} />
                <ScoreBar label="💪 건강" score={reading.scores.health} color="#34d399" delay={0.5} />
                <ScoreBar label="💼 직장" score={reading.scores.career} color="#60a5fa" delay={0.6} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 오늘의 한마디 */}
      {reading.advice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-6 mt-4 mb-4 relative z-10"
        >
          <div className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur rounded-2xl p-4 text-center border border-purple-400/20 shadow-lg">
            <p className="text-white font-medium text-base leading-relaxed">
              &ldquo;{reading.advice}&rdquo;
            </p>
          </div>
        </motion.div>
      )}

      {/* 시간대별 운세 */}
      {reading.time_of_day && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mx-6 mb-4"
        >
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
              <span>⏰</span> 시간대별 운세
            </h3>
            <div className="space-y-2.5">
              {[
                { icon: '🌅', label: '오전', content: reading.time_of_day.morning },
                { icon: '☀️', label: '오후', content: reading.time_of_day.afternoon },
                { icon: '🌙', label: '저녁', content: reading.time_of_day.evening },
              ].map((slot, idx) => (
                <motion.div
                  key={slot.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="flex gap-3 items-start"
                >
                  <div className="flex flex-col items-center shrink-0 w-10">
                    <span className="text-lg">{slot.icon}</span>
                    <span className="text-[10px] text-purple-300 mt-0.5">{slot.label}</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed flex-1">{slot.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 운세 섹션들 */}
      <div className="p-6 pt-2 space-y-3">
        {sections.map((section, idx) => (
          <motion.div
            key={section.title}
            custom={idx}
            initial="hidden"
            animate="visible"
            variants={sectionVariant}
            className={`p-4 rounded-2xl bg-gradient-to-br ${section.color} border ${section.border}`}
          >
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
              <span>{section.icon}</span>
              {section.title}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">
              {section.content}
            </p>
          </motion.div>
        ))}

        {/* 주의사항 */}
        {reading.warning && (
          <motion.div
            custom={sections.length}
            initial="hidden"
            animate="visible"
            variants={sectionVariant}
            className="p-4 rounded-2xl bg-gradient-to-br from-red-500/15 to-orange-500/15 border border-red-500/20"
          >
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
              <span>⚠️</span> 오늘의 주의사항
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">{reading.warning}</p>
          </motion.div>
        )}

        {/* 행운 아이템 그리드 */}
        {reading.lucky_items ? (
          <motion.div
            custom={sections.length + 1}
            initial="hidden"
            animate="visible"
            variants={sectionVariant}
            className="pt-2"
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-purple-300 text-[10px] mb-1.5">행운의 색상</p>
                <div className="flex items-center justify-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white/30 shadow"
                    style={{ backgroundColor: reading.lucky_items.color }}
                  />
                </div>
                <p className="text-white text-xs mt-1">{reading.lucky_items.colorName}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-purple-300 text-[10px] mb-1.5">행운의 숫자</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                  {reading.lucky_items.number}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-purple-300 text-[10px] mb-1.5">행운의 방위</p>
                <p className="text-lg">🧭</p>
                <p className="text-white text-xs mt-0.5">{reading.lucky_items.direction}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-purple-300 text-[10px] mb-1.5">행운의 음식</p>
                <p className="text-lg">🍽️</p>
                <p className="text-white text-xs mt-0.5">{reading.lucky_items.food}</p>
              </div>
              <div className="col-span-2 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-purple-300 text-[10px] mb-1.5">추천 활동</p>
                <p className="text-lg">🎯</p>
                <p className="text-white text-xs mt-0.5">{reading.lucky_items.activity}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            custom={sections.length}
            initial="hidden"
            animate="visible"
            variants={sectionVariant}
            className="flex gap-3 pt-2"
          >
            <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-purple-300 text-xs mb-2">행운의 색상</p>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/30 shadow-lg"
                  style={{ backgroundColor: reading.lucky_color }}
                />
                <span className="font-medium text-white text-sm">
                  {reading.lucky_color}
                </span>
              </div>
            </div>
            <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-purple-300 text-xs mb-2">행운의 숫자</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                {reading.lucky_number}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
