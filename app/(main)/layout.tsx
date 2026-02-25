import BottomNav from '@/components/BottomNav'
import AdBanner from '@/components/AdBanner'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div style={{ paddingBottom: 'calc(5rem + 50px + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </div>
      <BottomNav />
      <AdBanner />
    </>
  )
}
