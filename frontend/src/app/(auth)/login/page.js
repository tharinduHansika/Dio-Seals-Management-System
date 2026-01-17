'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setToken, user: storedUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  // Check if already logged in
  useEffect(() => {
    console.log('Stored user on mount:', storedUser)
    if (storedUser && storedUser.role) {
      console.log('Already logged in, redirecting to:', `/dashboard/${storedUser.role}`)
      router.push(`/dashboard/${storedUser.role}`)
    }
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      console.log('Attempting login with:', { username: data.username })
      
      const response = await api.post('/auth/login', data)
      
      console.log('Full login response:', response.data)
      
      if (response.data.success) {
        const { token, user } = response.data.data
        
        console.log('Received token:', token)
        console.log('Received user:', user)
        
        // Map role_name to role (lowercase)
        const roleMapping = {
          'Admin': 'admin',
          'Director': 'director',
          'Marketing Manager': 'marketing',
          'Store Keeper': 'storekeeper',
          'Printing Operator': 'printer',
          'Cashier': 'cashier',
          'Accountant': 'accountant',
        }
        
        // Get the lowercase role
        const role = roleMapping[user.role_name] || user.role_name.toLowerCase().replace(/\s+/g, '')
        
        console.log('Mapped role:', role)
        
        // Create user object with all needed fields
        const processedUser = {
          id: user.user_id,
          user_id: user.user_id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role_id: user.role_id,
          role_name: user.role_name,
          role: role,
          permissions: user.permissions,
        }
        
        console.log('Processed user object:', processedUser)
        
        // Store token first
        setToken(token)
        console.log('Token stored')
        
        // Then store user
        setUser(processedUser)
        console.log('User stored')
        
        // Verify storage
        const storedData = localStorage.getItem('auth-storage')
        console.log('Stored auth data:', storedData)
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const redirectPath = `/dashboard/${role}`
        console.log('Redirecting to:', redirectPath)
        
        toast.success('Login successful!')
        
        // Use replace instead of push to avoid back button issues
        router.replace(redirectPath)
        
      } else {
        throw new Error(response.data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      
      if (error.response) {
        console.error('Error response:', error.response.data)
        toast.error(error.response?.data?.message || 'Invalid credentials')
      } else if (error.request) {
        console.error('No response received:', error.request)
        toast.error('Cannot connect to server. Please check if backend is running on port 5000.')
      } else {
        console.error('Error:', error.message)
        toast.error(error.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Sign in to Dio Seals Management System</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <Input
            {...register('username')}
            icon={User}
            placeholder="Enter your username"
            error={errors.username?.message}
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="Enter your password"
            error={errors.password?.message}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconClick={() => setShowPassword(!showPassword)}
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <a href="#" className="text-sm text-primary hover:text-primary-dark">
            Forgot password?
          </a>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>
    </div>
  )
}