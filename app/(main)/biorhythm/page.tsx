'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from '@/components/DatePicker'
import BiorhythmCard from '@/components/BiorhythmCard'
import LoadingAnimation from '@/components/LoadingAnimation'
import { ScoreCircle } from '@/components/ScoreChart'
import {
  calculateBiorhythmToday,
  calculateBiorhythmChart,
  getBiorhythmStatus,
} from '@/lib/utils/biorhythm'

export default function BiorhythmPage() {
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [result, setResult] = useState<ReturnType<typeof calculateBiorhythmToday> | null>(null)
  const [chartData, setChartData] = useState<ReturnType<typeof calculateBiorhythmChart> | null>(null)
  const [step, setStep] = useState<'input' | 'result'>('input')
  const [pageLoading, setPageLoading] = useState(false)

  useEffect(() => {
    // 이전에 입력한 생년월일 복원
    const saved = sessionStorage.getItem('bio_birth_date')
    if (saved) setBirthDate(new Date(saved))
  }, [])

  const handleBirthDateChange = (date: Date | null) => {
    setBirthDate(date)
    if (date) sessionStorage.setItem('bio_birth_date', date.toISOString())
    else sessionStorage.removeItem('bio_birth_date')
  }

  const handleSubmit = async () => {
    if (!birthDate) return
    const today = new Date()
    const scores = calculateBiorhythmToday(birthDate, today)
    const chart = calculateBiorhythmChart(birthDate, today)
    setResult(scores)
    setChartData(chart)
    setStep('result')
  }

  const birthDateStr = birthDate
    ? `${birthDate.getFullYear()}.${String(birthDate.getMonth() + 1).padStart(2, '0')}.${String(birthDate.getDate()).padStart(2, '0')}`
    : ''

  if (pageLoading) return <LoadingAnimation />

  return (
    <div className="p-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* 입력 카드 */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-7">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                    className="text-5xl mb-3"
                  >
                    〰️
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-1">바이오리듬</h1>
                  <p className="text-indigo-300 text-sm">오늘의 신체·감성·지성 리듬 분석</p>
                </div>

                <div className="mb-6">
                  <label className="block text-white mb-2 text-sm font-medium">생년월일</label>
                  <DatePicker selected={birthDate} onChange={handleBirthDateChange} maxDate={new Date()} className="w-full" />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!birthDate}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  〰️ 바이오리듬 확인하기
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'result' && result && chartData && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              <BiorhythmCard
                physical={result.physical}
                emotional={result.emotional}
                intellectual={result.intellectual}
                chartData={chartData}
                birthDate={birthDateStr}
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <button
                  onClick={() => { setStep('input'); setResult(null); setChartData(null) }}
                  className="inline-block px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition"
                >
                  〰️ 다시 보기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
