'use client'

import { useState, useEffect } from 'react'
import DatePicker from '@/components/DatePicker'
import WeeklyCard from '@/components/WeeklyCard'
import LoadingAnimation from '@/components/LoadingAnimation'
import { motion, AnimatePresence } from 'framer-motion'
import type { WeeklyResponse } from '@/lib/ai/weekly-prompt'
import { showInterstitial } from '@/lib/ads/admob'

const BIRTH_DATE_KEY = 'ai-tarot-birthDate-weekly'

export default function WeeklyPage() {
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthHour, setBirthHour] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<WeeklyResponse | null>(null)
  const [cached, setCached] = useState(false)
  useEffect(() => {
    const saved = sessionStorage.getItem(BIRTH_DATE_KEY)
    if (saved) {
      setBirthDate(new Date(saved))
    }
  }, [])

  const handleSubmit = async () => {
    if (!birthDate) {
      setError('생년월일을 선택해주세요')
      return
    }

    setError(null)
    setLoading(true)

    await showInterstitial()

    try {
      // Save birth date for convenience
      sessionStorage.setItem(BIRTH_DATE_KEY, birthDate.toISOString())

      const response = await fetch('/api/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthDate.toISOString().split('T')[0],
          birthHour,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '주간 운세 생성에 실패했습니다')
      }

      const data = await response.json()
      setResult(data.reading)
      setCached(data.cached || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 py-8">
        <LoadingAnimation />
      </div>
    )
  }

  return (
    <div className="p-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-6">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="text-5xl mb-3"
                >
                  📅
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-1">주간 운세</h1>
                <p className="text-purple-200 text-sm">이번 주 요일별 운세를 알려드립니다</p>
              </div>

              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">생년월일</label>
                <DatePicker selected={birthDate} onChange={setBirthDate} maxDate={new Date()} className="w-full" />
              </div>

              <div className="mb-6">
                <label className="block text-white mb-2 text-sm font-medium">
                  태어난 시간 <span className="text-purple-400 font-normal">(선택)</span>
                </label>
                <select
                  value={birthHour ?? ''}
                  onChange={(e) =>
                    setBirthHour(e.target.value === '' ? null : Number(e.target.value))
                  }
                  className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 appearance-none"
                >
                  <option value="" className="bg-indigo-900">모름 / 미입력</option>
                  <option value="0" className="bg-indigo-900">자시 (23:30~01:30)</option>
                  <option value="1" className="bg-indigo-900">축시 (01:30~03:30)</option>
                  <option value="3" className="bg-indigo-900">인시 (03:30~05:30)</option>
                  <option value="5" className="bg-indigo-900">묘시 (05:30~07:30)</option>
                  <option value="7" className="bg-indigo-900">진시 (07:30~09:30)</option>
                  <option value="9" className="bg-indigo-900">사시 (09:30~11:30)</option>
                  <option value="11" className="bg-indigo-900">오시 (11:30~13:30)</option>
                  <option value="13" className="bg-indigo-900">미시 (13:30~15:30)</option>
                  <option value="15" className="bg-indigo-900">신시 (15:30~17:30)</option>
                  <option value="17" className="bg-indigo-900">유시 (17:30~19:30)</option>
                  <option value="19" className="bg-indigo-900">술시 (19:30~21:30)</option>
                  <option value="21" className="bg-indigo-900">해시 (21:30~23:30)</option>
                </select>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!birthDate}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📅 주간 운세 보기
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {cached && (
                <div className="text-center mb-3">
                  <span className="text-purple-300/60 text-xs bg-white/5 px-3 py-1 rounded-full">
                    이번 주 운세를 이미 생성하여 캐시된 결과입니다
                  </span>
                </div>
              )}
              <WeeklyCard reading={result} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => {
                    setResult(null)
                    setCached(false)
                  }}
                  className="inline-block px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition"
                >
                  📅 다시 보기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
