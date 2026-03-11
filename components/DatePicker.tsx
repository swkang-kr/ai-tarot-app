'use client'

import ReactDatePicker from 'react-datepicker'
import { ko } from 'date-fns/locale'
import { parse, isValid } from 'date-fns'
import { useState, useRef, useEffect } from 'react'
import { lunarToSolar } from '@fullstackfamily/manseryeok'
import 'react-datepicker/dist/react-datepicker.css'

interface DatePickerProps {
  selected: Date | null
  onChange: (date: Date) => void
  maxDate?: Date
  className?: string
}

type CalendarType = 'solar' | 'lunar'

export default function DatePicker({
  selected,
  onChange,
  maxDate = new Date(),
  className = ''
}: DatePickerProps) {
  const [calendarType, setCalendarType] = useState<CalendarType>('solar')
  const [inputValue, setInputValue] = useState('')
  const pickerRef = useRef<ReactDatePicker>(null)

  // 음력 입력 상태
  const [lunarYear, setLunarYear] = useState('')
  const [lunarMonth, setLunarMonth] = useState('')
  const [lunarDay, setLunarDay] = useState('')
  const [isLeapMonth, setIsLeapMonth] = useState(false)
  const [lunarError, setLunarError] = useState<string | null>(null)
  const [lunarConverted, setLunarConverted] = useState<string | null>(null)

  // 음력 입력값이 바뀔 때마다 변환 시도
  useEffect(() => {
    if (calendarType !== 'lunar') return

    const y = parseInt(lunarYear)
    const m = parseInt(lunarMonth)
    const d = parseInt(lunarDay)

    if (!lunarYear || !lunarMonth || !lunarDay) {
      setLunarError(null)
      setLunarConverted(null)
      return
    }

    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      setLunarError('숫자를 입력해주세요')
      setLunarConverted(null)
      return
    }

    if (y < 1900 || y > 2050) {
      setLunarError('1900~2050년 사이 연도를 입력해주세요')
      setLunarConverted(null)
      return
    }

    if (m < 1 || m > 12) {
      setLunarError('월은 1~12 사이로 입력해주세요')
      setLunarConverted(null)
      return
    }

    if (d < 1 || d > 30) {
      setLunarError('일은 1~30 사이로 입력해주세요')
      setLunarConverted(null)
      return
    }

    try {
      const result = lunarToSolar(y, m, d, isLeapMonth)
      const { year, month, day } = result.solar
      const solarDate = new Date(year, month - 1, day)

      if (solarDate > maxDate) {
        setLunarError('미래 날짜는 입력할 수 없습니다')
        setLunarConverted(null)
        return
      }

      const solarStr = `${year}년 ${month}월 ${day}일`
      setLunarConverted(solarStr)
      setLunarError(null)
      onChange(solarDate)
    } catch {
      setLunarError('해당 음력 날짜를 찾을 수 없습니다')
      setLunarConverted(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lunarYear, lunarMonth, lunarDay, isLeapMonth, calendarType])

  const handleRawChange = (event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    const target = (event?.target as HTMLInputElement) ?? null
    if (!target?.value) return
    const raw = target.value
    setInputValue(raw)

    const digits = raw.replace(/\D/g, '')

    if (digits.length === 8) {
      const parsed = parse(digits, 'yyyyMMdd', new Date())
      if (isValid(parsed) && parsed <= maxDate) {
        onChange(parsed)
        pickerRef.current?.setOpen(false)
      }
    }
  }

  const handleTypeSwitch = (type: CalendarType) => {
    setCalendarType(type)
    setLunarYear('')
    setLunarMonth('')
    setLunarDay('')
    setIsLeapMonth(false)
    setLunarError(null)
    setLunarConverted(null)
    setInputValue('')
  }

  return (
    <div className={`datepicker-wrapper ${className}`}>
      {/* 양력/음력 토글 */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => handleTypeSwitch('solar')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            calendarType === 'solar'
              ? 'bg-purple-600 text-white'
              : 'bg-white/10 text-purple-300 hover:bg-white/20'
          }`}
        >
          양력
        </button>
        <button
          type="button"
          onClick={() => handleTypeSwitch('lunar')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            calendarType === 'lunar'
              ? 'bg-purple-600 text-white'
              : 'bg-white/10 text-purple-300 hover:bg-white/20'
          }`}
        >
          음력
        </button>
      </div>

      {calendarType === 'solar' ? (
        <ReactDatePicker
          ref={pickerRef}
          selected={selected}
          onChange={(date: Date | null) => {
            if (date) {
              onChange(date)
              setInputValue('')
            }
          }}
          onChangeRaw={handleRawChange}
          dateFormat="yyyy년 MM월 dd일"
          locale={ko}
          maxDate={maxDate}
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          yearDropdownItemNumber={80}
          scrollableYearDropdown
          placeholderText="19900515 또는 달력 선택"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          calendarClassName="tarot-calendar"
          popperPlacement="bottom"
          showPopperArrow={false}
        />
      ) : (
        <div className="space-y-2">
          {/* 음력 입력 필드 */}
          <div className="flex gap-2">
            <input
              type="number"
              value={lunarYear}
              onChange={(e) => setLunarYear(e.target.value)}
              placeholder="년 (예: 1990)"
              min={1900}
              max={2050}
              className="w-[45%] px-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <input
              type="number"
              value={lunarMonth}
              onChange={(e) => setLunarMonth(e.target.value)}
              placeholder="월"
              min={1}
              max={12}
              className="w-[25%] px-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <input
              type="number"
              value={lunarDay}
              onChange={(e) => setLunarDay(e.target.value)}
              placeholder="일"
              min={1}
              max={30}
              className="w-[30%] px-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          {/* 윤달 토글 */}
          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <div
              onClick={() => setIsLeapMonth(!isLeapMonth)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                isLeapMonth ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                  isLeapMonth ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-purple-300 text-sm">윤달</span>
          </label>

          {/* 변환 결과 / 에러 */}
          {lunarConverted && (
            <p className="text-xs text-emerald-400 px-1">
              → 양력 {lunarConverted}
            </p>
          )}
          {lunarError && (
            <p className="text-xs text-red-400 px-1">{lunarError}</p>
          )}
        </div>
      )}
    </div>
  )
}
