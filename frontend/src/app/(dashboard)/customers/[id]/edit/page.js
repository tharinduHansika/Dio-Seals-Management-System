'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import api from '@/lib/api'

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  contact_person: z.string().min(1, 'Contact person is required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
})

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
  })

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await api.get(`/customers/${params.id}`)
      if (response.data.success) {
        const customer = response.data.data
        reset({
          name: customer.name,
          contact_person: customer.contact_person,
          email: customer.email,
          phone: customer.phone,
          address: customer.address || '',
          city: customer.city || '',
          country: customer.country || '',
        })
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      const response = await api.put(`/customers/${params.id}`, data)
      if (response.data.success) {
        toast.success('Customer updated successfully')
        router.push(`/customers/${params.id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update customer')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Customers', href: '/customers' },
          { label: 'Edit Customer' },
        ]}
      />

      <h1 className="text-3xl font-bold">Edit Customer</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Customer Name *"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Enter customer name"
              />
              <Input
                label="Contact Person *"
                {...register('contact_person')}
                error={errors.contact_person?.message}
                placeholder="Enter contact person"
              />
              <Input
                label="Email *"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="Enter email address"
              />
              <Input
                label="Phone *"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="Enter phone number"
              />
              <Input
                label="City"
                {...register('city')}
                error={errors.city?.message}
                placeholder="Enter city"
              />
              <Input
                label="Country"
                {...register('country')}
                error={errors.country?.message}
                placeholder="Enter country"
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Address"
                  {...register('address')}
                  error={errors.address?.message}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>
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
              Update Customer
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}