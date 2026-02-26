'use client'

import { useState } from 'react'
import DatePicker from '@/components/DatePicker'
import CompatibilityCard from '@/components/CompatibilityCard'
import LoadingAnimation from '@/components/LoadingAnimation'
import { motion, AnimatePresence } from 'framer-motion'
import type { CompatibilityResponse } from '@/lib/ai/compatibility-prompt'

const RELATIONSHIP_TYPES = [
  { value: 'lover', label: '💕 연인', desc: '사랑과 로맨스' },
  { value: 'friend', label: '🤝 친구', desc: '우정과 신뢰' },
  { value: 'colleague', label: '💼 직장동료', desc: '업무 협업' },
  { value: 'family', label: '👨‍👩‍👧 가족', desc: '가족 관계' },
]

export default function CompatibilityPage() {
  const [person1Date, setPerson1Date] = useState<Date | null>(null)
  const [person1Hour, setPerson1Hour] = useState<number | null>(null)
  const [person2Date, setPerson2Date] = useState<Date | null>(null)
  const [person2Hour, setPerson2Hour] = useState<number | null>(null)
  const [relationshipType, setRelationshipType] = useState('lover')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompatibilityResponse | null>(null)
  const handleSubmit = async () => {
    if (!person1Date || !person2Date) {
      setError('두 사람의 생년월일을 모두 입력해주세요')
      return
    }

    setError(null)
    setLoading(true)


    try {
      const response = await fetch('/api/compatibility', {
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

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '궁합 분석에 실패했습니다')
      }

      const { reading } = await response.json()
      setResult(reading)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const BirthTimeSelect = ({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) => (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 appearance-none"
    >
      <option value="" className="bg-indigo-900">모름</option>
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
  )

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
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-5xl mb-3"
                >
                  💕
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-1">궁합 보기</h1>
                <p className="text-purple-200 text-sm">두 사람의 사주로 궁합을 봐드립니다</p>
              </div>

              {/* 나 */}
              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">나의 생년월일</label>
                <DatePicker selected={person1Date} onChange={setPerson1Date} maxDate={new Date()} className="w-full" />
                <div className="mt-2">
                  <label className="block text-white/60 mb-1 text-xs">태어난 시간 (선택)</label>
                  <BirthTimeSelect value={person1Hour} onChange={setPerson1Hour} />
                </div>
              </div>

              {/* 상대 */}
              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">상대의 생년월일</label>
                <DatePicker selected={person2Date} onChange={setPerson2Date} maxDate={new Date()} className="w-full" />
                <div className="mt-2">
                  <label className="block text-white/60 mb-1 text-xs">태어난 시간 (선택)</label>
                  <BirthTimeSelect value={person2Hour} onChange={setPerson2Hour} />
                </div>
              </div>

              {/* 관계 유형 */}
              <div className="mb-6">
                <label className="block text-white mb-2 text-sm font-medium">관계 유형</label>
                <div className="grid grid-cols-2 gap-2">
                  {RELATIONSHIP_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setRelationshipType(type.value)}
                      className={`p-3 rounded-xl border text-center transition ${
                        relationshipType === type.value
                          ? 'bg-purple-500/30 border-purple-400/50 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-60">{type.desc}</p>
                    </button>
                  ))}
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
                💕 궁합 보기
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CompatibilityCard reading={result} relationshipType={relationshipType} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 space-y-3 text-center"
              >
                {/* 심층 궁합 업그레이드 배너 */}
                <a
                  href="/compatibility-deep"
                  className="flex items-center gap-3 bg-gradient-to-r from-pink-500/15 to-purple-500/10 border border-pink-500/20 rounded-2xl p-4 hover:from-pink-500/20 transition"
                >
                  <span className="text-2xl">✨</span>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium text-sm">심층 궁합 분석으로 업그레이드</p>
                    <p className="text-white/50 text-xs">오행 분석 · 갈등/조화 · 5년 전망 · 12개월 흐름</p>
                  </div>
                  <span className="text-pink-300 text-sm">→</span>
                </a>
                <button
                  onClick={() => setResult(null)}
                  className="inline-block px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition"
                >
                  💕 다시 보기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
