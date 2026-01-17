'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Breadcrumb from '@/components/layout/Breadcrumb'
import api from '@/lib/api'

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  role: z.enum(['admin', 'director', 'marketing', 'storekeeper', 'printer', 'cashier', 'accountant']),
  status: z.enum(['active', 'inactive']),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

export default function NewUserPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      status: 'active',
    },
  })

  const onSubmit = async (data) => {
    try {
      const { confirm_password, ...userData } = data
      const response = await api.post('/users', userData)
      if (response.data.success) {
        toast.success('User created successfully')
        router.push('/users')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Users', href: '/users' },
          { label: 'New User' },
        ]}
      />

      <h1 className="text-3xl font-bold">Create New User</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Username *"
                {...register('username')}
                error={errors.username?.message}
                placeholder="Enter username"
              />
              <Input
                label="Email *"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="Enter email address"
              />
              <Input
                label="Password *"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                placeholder="Enter password"
              />
              <Input
                label="Confirm Password *"
                type="password"
                {...register('confirm_password')}
                error={errors.confirm_password?.message}
                placeholder="Confirm password"
              />
              <Select
                label="Role *"
                {...register('role')}
                error={errors.role?.message}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'director', label: 'Director' },
                  { value: 'marketing', label: 'Marketing Manager' },
                  { value: 'storekeeper', label: 'Store Keeper' },
                  { value: 'printer', label: 'Printing Operator' },
                  { value: 'cashier', label: 'Cashier' },
                  { value: 'accountant', label: 'Accountant' },
                ]}
              />
              <Select
                label="Status *"
                {...register('status')}
                error={errors.status?.message}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create User
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}