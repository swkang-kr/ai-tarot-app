import BottomNav from '@/components/BottomNav'
import AdBanner from '@/components/AdBanner'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="main-content-wrapper">
        {children}
      </div>
      <BottomNav />
      <AdBanner />
    </>
  )
}
