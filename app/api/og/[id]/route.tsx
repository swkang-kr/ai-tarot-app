import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient()
  const { data: reading } = await supabase
    .from('readings')
    .select('keywords, overall, lucky_color, lucky_number, birth_date')
    .eq('id', params.id)
    .single()

  const keywords: string[] = reading?.keywords ?? ['운세', '타로']
  const overall: string = reading?.overall ?? '오늘의 AI 타로 운세를 확인해보세요'
  const luckyColor: string = reading?.lucky_color ?? '#8b5cf6'
  const luckyNumber: number = reading?.lucky_number ?? 7
  const snippet = overall.length > 70 ? overall.slice(0, 68) + '…' : overall

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, #0f0c29, #302b63, #24243e)`,
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${luckyColor}44 0%, transparent 70%)`,
            top: '-100px',
            right: '-100px',
          }}
        />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
          <span style={{ fontSize: '48px' }}>🔮</span>
          <span style={{ fontSize: '36px', fontWeight: 700, color: 'white', letterSpacing: '-1px' }}>
            AI 타로
          </span>
        </div>

        {/* Keywords */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          {keywords.slice(0, 3).map((kw, i) => (
            <div
              key={i}
              style={{
                background: `${luckyColor}55`,
                border: `1px solid ${luckyColor}88`,
                color: 'white',
                padding: '8px 20px',
                borderRadius: '100px',
                fontSize: '20px',
                fontWeight: 600,
              }}
            >
              {kw}
            </div>
          ))}
        </div>

        {/* Main text */}
        <div
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '28px',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: '1.5',
            marginBottom: '48px',
            padding: '0 48px',
          }}
        >
          {snippet}
        </div>

        {/* Lucky info */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: luckyColor,
                border: '3px solid rgba(255,255,255,0.3)',
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>행운의 색</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `${luckyColor}44`,
                border: `2px solid ${luckyColor}88`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
                color: 'white',
              }}
            >
              {luckyNumber}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>행운의 숫자</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '18px',
          }}
        >
          ai-tarot.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
