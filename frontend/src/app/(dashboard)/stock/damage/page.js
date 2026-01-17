'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Breadcrumb from '@/components/layout/Breadcrumb'
import api from '@/lib/api'

const damageSchema = z.object({
  damage_date: z.string().min(1, 'Date is required'),
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().optional(),
})

export default function RecordDamagePage() {
  const router = useRouter()
  const [products, setProducts] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(damageSchema),
    defaultValues: {
      damage_date: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products')
      if (response.data.success) {
        setProducts(response.data.data.map(p => ({ 
          value: p.id.toString(), 
          label: `${p.name} (${p.sku})` 
        })))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/stock/damage', {
        ...data,
        product_id: parseInt(data.product_id),
        quantity: parseInt(data.quantity),
      })
      if (response.data.success) {
        toast.success('Damage recorded successfully')
        router.push('/stock')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record damage')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Stock', href: '/stock' },
          { label: 'Record Damage' },
        ]}
      />

      <h1 className="text-3xl font-bold">Record Damage/Waste</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Damage Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date *"
                type="date"
                {...register('damage_date')}
                error={errors.damage_date?.message}
              />
              <Select
                label="Product *"
                {...register('product_id')}
                error={errors.product_id?.message}
                options={products}
              />
              <Input
                label="Quantity *"
                type="number"
                {...register('quantity')}
                error={errors.quantity?.message}
                placeholder="Enter quantity"
              />
              <Select
                label="Reason *"
                {...register('reason')}
                error={errors.reason?.message}
                options={[
                  { value: 'expired', label: 'Expired' },
                  { value: 'damaged_storage', label: 'Damaged in Storage' },
                  { value: 'production_defect', label: 'Production Defect' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  {...register('description')}
                  placeholder="Additional details about the damage..."
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
              Record Damage
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}