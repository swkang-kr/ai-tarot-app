'use client'

export type Gender = 'male' | 'female'

interface GenderSelectProps {
  value: Gender | null
  onChange: (gender: Gender) => void
}

export default function GenderSelect({ value, onChange }: GenderSelectProps) {
  return (
    <div className="mb-4">
      <label className="block text-white mb-2 text-sm font-medium">
        성별 <span className="text-amber-400 font-normal text-xs">(대운 방향 정확도에 영향)</span>
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange('male')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
            value === 'male'
              ? 'bg-blue-500/60 border border-blue-400/60 text-white'
              : 'bg-white/10 border border-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          <span>♂</span> 남성
        </button>
        <button
          type="button"
          onClick={() => onChange('female')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
            value === 'female'
              ? 'bg-pink-500/60 border border-pink-400/60 text-white'
              : 'bg-white/10 border border-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          <span>♀</span> 여성
        </button>
      </div>
    </div>
  )
}
