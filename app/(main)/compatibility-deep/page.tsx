'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from '@/components/DatePicker'
import DeepCompatibilityCard from '@/components/DeepCompatibilityCard'
import LoadingAnimation from '@/components/LoadingAnimation'
import type { DeepCompatibilityResponse } from '@/lib/ai/deep-compatibility-prompt'
import { showInterstitial } from '@/lib/ads/admob'

const RELATIONSHIP_TYPES = [
  { value: 'lover', label: '💕 연인', desc: '사랑과 로맨스' },
  { value: 'spouse', label: '💍 부부', desc: '결혼 생활' },
  { value: 'friend', label: '🤝 친구', desc: '우정과 신뢰' },
  { value: 'business', label: '💼 비즈니스', desc: '사업 파트너' },
]

const HOUR_OPTIONS = [
  { value: '', label: '모름 / 미입력' },
  { value: '0', label: '자시 (23:30~01:30)' },
  { value: '1', label: '축시 (01:30~03:30)' },
  { value: '3', label: '인시 (03:30~05:30)' },
  { value: '5', label: '묘시 (05:30~07:30)' },
  { value: '7', label: '진시 (07:30~09:30)' },
  { value: '9', label: '사시 (09:30~11:30)' },
  { value: '11', label: '오시 (11:30~13:30)' },
  { value: '13', label: '미시 (13:30~15:30)' },
  { value: '15', label: '신시 (15:30~17:30)' },
  { value: '17', label: '유시 (17:30~19:30)' },
  { value: '19', label: '술시 (19:30~21:30)' },
  { value: '21', label: '해시 (21:30~23:30)' },
]

export default function DeepCompatibilityPage() {
  const [person1Date, setPerson1Date] = useState<Date | null>(null)
  const [person1Hour, setPerson1Hour] = useState<number | null>(null)
  const [person2Date, setPerson2Date] = useState<Date | null>(null)
  const [person2Hour, setPerson2Hour] = useState<number | null>(null)
  const [relationshipType, setRelationshipType] = useState('lover')
  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input')
  const [result, setResult] = useState<DeepCompatibilityResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const doSubmit = useCallback(async () => {
    if (!person1Date || !person2Date) {
      setError('두 사람의 생년월일을 모두 입력해주세요')
      return
    }

    setError(null)
    setStep('loading')

    await showInterstitial()

    try {
      const res = await fetch('/api/compatibility-deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1BirthDate: person1Date.toISOString().split('T')[0],
          person1BirthHour: person1Hour,
          person2BirthDate: person2Date.toISOString().split('T')[0],
          person2BirthHour: person2Hour,
          relationshipType,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || '분석에 실패했습니다')
      }
      const d = await res.json()
      setResult(d.reading)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      setStep('input')
    }
  }, [person1Date, person1Hour, person2Date, person2Hour, relationshipType])

  const handleSubmit = useCallback(async () => {
    await doSubmit()
  }, [doSubmit])

  if (step === 'loading') return <div className="p-4 py-8"><LoadingAnimation /></div>

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
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="text-5xl mb-3"
                  >
                    💕
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white mb-1">심층 궁합 분석</h1>
                  <p className="text-pink-300 text-sm">오행 심층 분석 · 갈등/조화 포인트 · 5년 전망</p>
                </div>

                <div className="mb-5">
                  <label className="block text-white mb-2 text-sm font-medium">관계 유형</label>
                  <div className="grid grid-cols-2 gap-2">
                    {RELATIONSHIP_TYPES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRelationshipType(r.value)}
                        className={`py-2.5 rounded-xl text-sm font-medium transition ${
                          relationshipType === r.value
                            ? 'bg-pink-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-white/60 text-xs font-medium mb-3">👤 첫 번째 사람</p>
                  <div className="space-y-3">
                    <DatePicker selected={person1Date} onChange={setPerson1Date} maxDate={new Date()} className="w-full" />
                    <select
                      value={person1Hour ?? ''}
                      onChange={(e) => setPerson1Hour(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none appearance-none"
                    >
                      {HOUR_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-indigo-900">{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-white/60 text-xs font-medium mb-3">👤 두 번째 사람</p>
                  <div className="space-y-3">
                    <DatePicker selected={person2Date} onChange={setPerson2Date} maxDate={new Date()} className="w-full" />
                    <select
                      value={person2Hour ?? ''}
                      onChange={(e) => setPerson2Hour(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none appearance-none"
                    >
                      {HOUR_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-indigo-900">{o.label}</option>
                      ))}
                    </select>
                  </div>
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
                  disabled={!person1Date || !person2Date}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💕 심층 궁합 분석하기
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
              <DeepCompatibilityCard reading={result} relationshipType={relationshipType} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => { setStep('input'); setResult(null) }}
                  className="inline-block px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition"
                >
                  💕 다시 분석하기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
