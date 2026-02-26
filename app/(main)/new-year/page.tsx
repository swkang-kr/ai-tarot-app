'use client'

import { Suspense, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from '@/components/DatePicker'
import NewYearCard from '@/components/NewYearCard'
import SajuCard from '@/components/SajuCard'
import LoadingAnimation from '@/components/LoadingAnimation'
import type { NewYearResponse } from '@/lib/ai/new-year-prompt'
import { getSajuInfo } from '@/lib/utils/saju'

export default function NewYearPage() {
  return (
    <Suspense fallback={<LoadingAnimation />}>
      <NewYearContent />
    </Suspense>
  )
}

function NewYearContent() {
  const searchParams = useSearchParams()

  const yearParam = searchParams.get('year')
  const currentYear = new Date().getFullYear()
  const parsedYear = parseInt(yearParam ?? '', 10)
  const initialYear = !isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : currentYear

  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthHour, setBirthHour] = useState<number | null>(null)
  const [targetYear, setTargetYear] = useState(initialYear)
  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input')
  const [result, setResult] = useState<NewYearResponse | null>(null)
  const [sajuInfo, setSajuInfo] = useState<ReturnType<typeof getSajuInfo> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const doSubmit = useCallback(async () => {
    if (!birthDate) { setError('생년월일을 선택해주세요'); return }
    setError(null)
    setStep('loading')


    const dateStr = birthDate.toISOString().split('T')[0]
    try {
      const saju = getSajuInfo(dateStr, birthHour ?? undefined)
      setSajuInfo(saju)
      const res = await fetch('/api/new-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate: dateStr, birthHour, targetYear }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || '신년운세 생성에 실패했습니다')
      }
      const d = await res.json()
      setResult(d.analysis)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      setStep('input')
    }
  }, [birthDate, birthHour, targetYear])

  const handleSubmit = useCallback(async () => {
    await doSubmit()
  }, [doSubmit])

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
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-7">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                    className="text-5xl mb-3"
                  >
                    🎊
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-1">신년운세</h1>
                  <p className="text-red-300 text-sm">새해 사주 분석으로 운세 흐름을 파악하세요</p>
                </div>

                {/* 연도 선택 */}
                <div className="mb-4">
                  <label className="block text-white mb-2 text-sm font-medium">분석 연도</label>
                  <div className="flex gap-2">
                    {[currentYear, currentYear + 1].map((y) => (
                      <button
                        key={y}
                        onClick={() => setTargetYear(y)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                          targetYear === y
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {y}년
                      </button>
                    ))}
                  </div>
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
                    onChange={(e) => setBirthHour(e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 appearance-none"
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
                  className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎊 {targetYear}년 신년운세 보기
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
              {sajuInfo && (
                <div className="mb-6">
                  <SajuCard saju={sajuInfo} />
                </div>
              )}
              <NewYearCard analysis={result} targetYear={targetYear} />
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
                  🎊 다시 보기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
