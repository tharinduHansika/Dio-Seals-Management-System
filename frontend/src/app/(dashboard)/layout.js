'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function DashLayout({ children }) {
  const router = useRouter()
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!token || !user) {
      router.replace('/login')
    }
  }, [token, user, router])

  if (!token || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <DashboardLayout>{children}</DashboardLayout>
}