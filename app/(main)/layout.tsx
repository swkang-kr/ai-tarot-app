import BottomNav from '@/components/BottomNav'
import AdBanner from '@/components/AdBanner'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div style={{ paddingBottom: 'calc(5rem + var(--ad-banner-height, 0px) + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </div>
      <BottomNav />
      <AdBanner />
    </>
  )
}
