'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DatePicker from '@/components/DatePicker'
import CardSelectionScreen from '@/components/CardSelectionScreen'
import LoadingAnimation from '@/components/LoadingAnimation'
import DailyJinjinCard from '@/components/DailyJinjinCard'
import TarotCard from '@/components/TarotCard'
import SajuCard from '@/components/SajuCard'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { TarotCard as TarotCardType } from '@/lib/data/tarot-cards'
import { calculateDailyJinjin } from '@/lib/utils/daily-jinjin'
import { getSajuInfo, type SajuInfo } from '@/lib/utils/saju'

const BIRTH_DATE_KEY = 'ai-tarot-birthDate'

interface ReadingHistory {
  id: string
  birth_date: string
  keywords: string[]
  overall: string
  lucky_color: string
  created_at: string
}

export default function HomePage() {
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthHour, setBirthHour] = useState<number | null>(null)
  const [step, setStep] = useState<'input' | 'selection' | 'loading' | 'result'>('input')
  const [selectedCards, setSelectedCards] = useState<TarotCardType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [inlineResult, setInlineResult] = useState<any>(null)
  const [inlineSaju, setInlineSaju] = useState<SajuInfo | null>(null)
  const [history, setHistory] = useState<ReadingHistory[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const dailyJinjin = useMemo(() => calculateDailyJinjin(), [])

  useEffect(() => {
    const saved = sessionStorage.getItem(BIRTH_DATE_KEY)
    if (saved) {
      setBirthDate(new Date(saved))
      sessionStorage.removeItem(BIRTH_DATE_KEY)
    }
    loadHistory()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadHistory()
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadHistory = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoggedIn(false)
      setHistory([])
      return
    }

    setIsLoggedIn(true)

    const { data } = await supabase
      .from('readings')
      .select('id, birth_date, keywords, overall, lucky_color, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setHistory(data)
    }
  }

  const handleStartSelection = () => {
    if (!birthDate) {
      setError('생년월일을 선택해주세요')
      return
    }

    setError(null)
    setStep('selection')
  }

  const handleCardSelectionComplete = useCallback(
    async (cards: TarotCardType[]) => {
      setSelectedCards(cards)
      setStep('loading')
      setError(null)


      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: birthDate!.toISOString().split('T')[0],
            birthHour: birthHour,
            selectedCards: cards.map((c) => ({
              id: c.id,
              name: c.name,
              nameEn: c.nameEn,
              symbol: c.symbol,
              element: c.element,
              isReversed: c.isReversed,
              uprightKeywords: c.uprightKeywords,
              reversedMeaning: c.reversedMeaning,
            })),
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || '운세 생성에 실패했습니다')
        }

        const data = await response.json()

        if (data.readingId) {
          // Logged-in user: saved to DB, go to result page
          router.push(`/result/${data.readingId}`)
        } else if (data.reading) {
          // Anonymous user: show result inline
          setInlineResult(data.reading)
          try {
            const sajuInfo = getSajuInfo(data.reading.birth_date, data.reading.birth_hour ?? undefined)
            setInlineSaju(sajuInfo)
          } catch {}
          setStep('result')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다')
        setStep('input')
      }
    },
    [birthDate, birthHour, router]
  )

  const handleBack = useCallback(() => {
    setStep('input')
    setSelectedCards([])
  }, [])

  return (
    <div className="p-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {/* Step: Input */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="text-6xl mb-4"
                >
                  🔮
                </motion.div>
                <h1 className="text-3xl font-bold text-white mb-2">별빛 운세</h1>
                <p className="text-purple-200">
                  별빛이 전하는 오늘의 운세
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">
                  생년월일을 선택해주세요
                </label>
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
                onClick={handleStartSelection}
                disabled={!birthDate}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🃏 카드 선택하기
              </motion.button>
            </motion.div>
          )}

          {/* Step: Card Selection */}
          {step === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl"
            >
              <CardSelectionScreen
                onComplete={handleCardSelectionComplete}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {/* Step: Loading */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingAnimation />
            </motion.div>
          )}

          {/* Step: Inline Result (anonymous users) */}
          {step === 'result' && inlineResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <TarotCard reading={inlineResult} />

              {inlineSaju && (
                <SajuCard saju={inlineSaju} analysis={inlineResult.saju_analysis} />
              )}

              <div className="bg-purple-500/20 border border-purple-400/30 rounded-2xl p-4 text-center">
                <p className="text-purple-200 text-sm mb-3">
                  로그인하면 운세 기록이 저장됩니다
                </p>
                <a
                  href="/login?redirect=/"
                  className="inline-block px-6 py-2 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-400 transition"
                >
                  로그인하기
                </a>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setStep('input')
                    setInlineResult(null)
                    setInlineSaju(null)
                  }}
                  className="inline-block px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition"
                >
                  다시 보기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lucky shortcut banner - only visible on input step */}
        {step === 'input' && (
          <motion.a
            href="/lucky"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-4 bg-gradient-to-r from-green-500/15 to-teal-500/10 border border-green-500/20 backdrop-blur rounded-2xl p-4 hover:from-green-500/20 hover:to-teal-500/15 transition"
          >
            <span className="text-3xl">🍀</span>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">오늘의 행운</p>
              <p className="text-white/50 text-xs">사주 오행으로 보는 행운 색·방위·음식 · 무료</p>
            </div>
            <span className="text-white/40 text-sm">→</span>
          </motion.a>
        )}

        {/* Daily Jinjin - only visible on input step */}
        {step === 'input' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DailyJinjinCard data={dailyJinjin} />
          </motion.div>
        )}

        {/* History - only visible on input step */}
        {step === 'input' && (
          <AnimatePresence>
            {isLoggedIn && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">📜 내 운세 기록</h2>
                  <a
                    href="/history"
                    className="text-purple-300 text-xs hover:text-purple-200 transition"
                  >
                    전체보기 →
                  </a>
                </div>
                <div className="space-y-3">
                  {history.map((reading, idx) => (
                    <motion.a
                      key={reading.id}
                      href={`/result/${reading.id}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer"
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${reading.lucky_color}44, #312e8166)`,
                        }}
                      >
                        🔮
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {reading.keywords
                            .slice(0, 2)
                            .map((kw: string, i: number) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-200 rounded-full"
                              >
                                {kw}
                              </span>
                            ))}
                        </div>
                        <p className="text-white/70 text-xs truncate">
                          {reading.overall}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-purple-300 text-xs">
                          {format(new Date(reading.created_at), 'M/d', {
                            locale: ko
                          })}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
