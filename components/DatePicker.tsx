'use client'

import ReactDatePicker from 'react-datepicker'
import { ko } from 'date-fns/locale'
import { parse, isValid } from 'date-fns'
import { useState, useRef } from 'react'
import 'react-datepicker/dist/react-datepicker.css'

interface DatePickerProps {
  selected: Date | null
  onChange: (date: Date) => void
  maxDate?: Date
  className?: string
}

export default function DatePicker({
  selected,
  onChange,
  maxDate = new Date(),
  className = ''
}: DatePickerProps) {
  const [inputValue, setInputValue] = useState('')
  const pickerRef = useRef<ReactDatePicker>(null)

  const handleRawChange = (event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    const target = (event?.target as HTMLInputElement) ?? null
    if (!target?.value) return
    const raw = target.value
    setInputValue(raw)

    // 숫자만 추출
    const digits = raw.replace(/\D/g, '')

    // 8자리 입력 시 날짜 파싱 (19900515, 20001231 등)
    if (digits.length === 8) {
      const parsed = parse(digits, 'yyyyMMdd', new Date())
      if (isValid(parsed) && parsed <= maxDate) {
        onChange(parsed)
        pickerRef.current?.setOpen(false)  // 달력 모달 닫기
      }
    }
  }

  return (
    <div className={`datepicker-wrapper ${className}`}>
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
    </div>
  )
}
