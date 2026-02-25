import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-tarot.vercel.app'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const supabase = createAdminClient()
  const { data: reading } = await supabase
    .from('readings')
    .select('keywords, overall')
    .eq('id', params.id)
    .single()

  const title = reading?.keywords?.length
    ? `🔮 ${reading.keywords.slice(0, 2).join(' ')} - AI 타로 운세`
    : 'AI 타로 운세 결과'
  const description = reading?.overall
    ? reading.overall.slice(0, 80)
    : 'AI가 읽어주는 오늘의 타로 운세'

  const ogImageUrl = `${APP_URL}/api/og/${params.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return children
}
