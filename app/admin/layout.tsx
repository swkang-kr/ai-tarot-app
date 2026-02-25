import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import AdminSidebar from '@/components/AdminSidebar'
import { isAdminEmail } from '@/lib/utils/admin'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
