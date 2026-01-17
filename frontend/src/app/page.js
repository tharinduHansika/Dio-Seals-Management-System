'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    console.log('Home page - User:', user)
    console.log('Home page - Token:', token)
    
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      if (token && user && user.role) {
        console.log('Redirecting to:', `/dashboard/${user.role}`)
        router.replace(`/dashboard/${user.role}`)
      } else {
        console.log('No auth found, redirecting to login')
        router.replace('/login')
      }
      setIsChecking(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [user, token, router])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return null
}