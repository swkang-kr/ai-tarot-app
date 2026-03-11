'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from '@/components/DatePicker'
import AnnualCard from '@/components/AnnualCard'
import LoadingAnimation from '@/components/LoadingAnimation'
import type { AnnualResponse } from '@/lib/ai/annual-prompt'
import GenderSelect, { type Gender } from '@/components/GenderSelect'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR + 1]

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function AnnualPage() {
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthHour, setBirthHour] = useState<number | null>(null)
  const [gender, setGender] = useState<Gender | null>(null)
  const [targetYear, setTargetYear] = useState(CURRENT_YEAR)
  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input')
  const [result, setResult] = useState<AnnualResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!birthDate) {
      setError('생년월일을 선택해주세요')
      return
    }

    setError(null)
    setStep('loading')


    try {
      const res = await fetch('/api/annual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: birthDate.toISOString().split('T')[0],
          birthHour,
          gender,
          targetYear,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || '연간 운세 생성에 실패했습니다')
      }

      const d = await res.json()
      setResult(d.analysis)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      setStep('input')
    }
  }, [birthDate, birthHour, targetYear])

  if (step === 'loading') {
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
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <button onClick={() => window.location.href = '/premium'} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm mb-4 transition-colors">
                ← 프리미엄
              </button>
              {/* 입력 카드 */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-7">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    className="text-5xl mb-3"
                  >
                    📆
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-1">연간 운세</h1>
                  <p className="text-sky-300 text-sm">12개월 월별 흐름을 한눈에</p>
                </div>

                {/* 연도 선택 */}
                <div className="mb-4">
                  <label className="block text-white mb-2 text-sm font-medium">연도</label>
                  <div className="flex gap-2">
                    {YEAR_OPTIONS.map((year) => (
                      <button
                        key={year}
                        onClick={() => setTargetYear(year)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                          targetYear === year
                            ? 'bg-sky-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {year}년
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-white mb-2 text-sm font-medium">생년월일</label>
                  <DatePicker selected={birthDate} onChange={setBirthDate} maxDate={new Date()} className="w-full" />
                </div>

                <GenderSelect value={gender} onChange={setGender} />

                <div className="mb-6">
                  <label className="block text-white mb-2 text-sm font-medium">
                    태어난 시간 <span className="text-purple-400 font-normal">(선택)</span>
                  </label>
                  <select
                    value={birthHour ?? ''}
                    onChange={(e) => setBirthHour(e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-400 appearance-none"
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
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📆 {targetYear}년 운세 보기
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AnnualCard analysis={result} targetYear={targetYear} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => { setStep('input'); setResult(null) }}
                  className="inline-block px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition"
                >
                  📆 다시 보기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
