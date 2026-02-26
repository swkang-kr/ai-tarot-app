import BottomNav from '@/components/BottomNav'
import AdBanner from '@/components/AdBanner'
import MainContent from '@/components/MainContent'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MainContent>
        {children}
      </MainContent>
      <BottomNav />
      <AdBanner />
    </>
  )
}
