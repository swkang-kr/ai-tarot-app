'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from '@/components/DatePicker'
import LuckyCard from '@/components/LuckyCard'
import { getSajuInfo, getDetailedAnalysis } from '@/lib/utils/saju'
import { calculateLucky, type LuckyInfo } from '@/lib/utils/lucky'

export default function LuckyPage() {
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthHour, setBirthHour] = useState<number | null>(null)
  const [step, setStep] = useState<'input' | 'result'>('input')
  const [luckyInfo, setLuckyInfo] = useState<LuckyInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!birthDate) return
    try {
      setError(null)
      const dateStr = `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`
      const saju = getSajuInfo(dateStr, birthHour ?? undefined)
      const detail = getDetailedAnalysis(saju)
      const lucky = calculateLucky(saju, new Date(), detail.bodyStrength)
      setLuckyInfo(lucky)
      setStep('result')
    } catch (e) {
      setError('계산 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const birthDateStr = birthDate
    ? `${birthDate.getFullYear()}.${String(birthDate.getMonth() + 1).padStart(2, '0')}.${String(birthDate.getDate()).padStart(2, '0')}`
    : ''

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
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-7">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="text-5xl mb-3"
                >
                  🍀
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-1">오늘의 행운</h1>
                <p className="text-purple-300 text-sm">사주 오행으로 보는 오늘의 행운 아이템</p>
              </div>

              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">생년월일</label>
                <DatePicker
                  selected={birthDate}
                  onChange={setBirthDate}
                  maxDate={new Date()}
                  className="w-full"
                />
              </div>

              <div className="mb-6">
                <label className="block text-white mb-2 text-sm font-medium">
                  태어난 시간 <span className="text-purple-400 font-normal">(선택)</span>
                </label>
                <select
                  value={birthHour ?? ''}
                  onChange={(e) => setBirthHour(e.target.value === '' ? null : Number(e.target.value))}
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
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!birthDate}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🍀 오늘의 행운 보기
              </motion.button>

              <p className="text-center text-purple-300/60 text-xs mt-4">
                무료 · 매일 갱신 · 로그인 불필요
              </p>
            </motion.div>
          )}

          {step === 'result' && luckyInfo && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <LuckyCard luckyInfo={luckyInfo} birthDateStr={birthDateStr} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => setStep('input')}
                  className="px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition text-sm"
                >
                  🔄 다시 보기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
