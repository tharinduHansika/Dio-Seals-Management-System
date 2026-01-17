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
import Textarea from '@/components/ui/Textarea'
import Breadcrumb from '@/components/layout/Breadcrumb'
import api from '@/lib/api'

const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  category: z.string().min(1, 'Category is required'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  purchase_cost: z.string().min(1, 'Purchase cost is required'),
  current_value: z.string().min(1, 'Current value is required'),
  location: z.string().optional(),
  serial_number: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'disposed']),
  description: z.string().optional(),
})

export default function NewAssetPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'active',
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/assets', {
        ...data,
        purchase_cost: parseFloat(data.purchase_cost),
        current_value: parseFloat(data.current_value),
      })
      if (response.data.success) {
        toast.success('Asset added successfully')
        router.push('/assets')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add asset')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Assets', href: '/assets' },
          { label: 'New Asset' },
        ]}
      />

      <h1 className="text-3xl font-bold">Add New Asset</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Asset Name *"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Enter asset name"
              />
              <Select
                label="Category *"
                {...register('category')}
                error={errors.category?.message}
                options={[
                  { value: 'equipment', label: 'Equipment' },
                  { value: 'vehicle', label: 'Vehicle' },
                  { value: 'furniture', label: 'Furniture' },
                  { value: 'electronics', label: 'Electronics' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Input
                label="Purchase Date *"
                type="date"
                {...register('purchase_date')}
                error={errors.purchase_date?.message}
              />
              <Input
                label="Purchase Cost *"
                type="number"
                step="0.01"
                {...register('purchase_cost')}
                error={errors.purchase_cost?.message}
                placeholder="0.00"
              />
              <Input
                label="Current Value *"
                type="number"
                step="0.01"
                {...register('current_value')}
                error={errors.current_value?.message}
                placeholder="0.00"
              />
              <Input
                label="Location"
                {...register('location')}
                placeholder="Where the asset is located"
              />
              <Input
                label="Serial Number"
                {...register('serial_number')}
                placeholder="Asset serial number"
              />
              <Select
                label="Status *"
                {...register('status')}
                error={errors.status?.message}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'maintenance', label: 'Under Maintenance' },
                  { value: 'disposed', label: 'Disposed' },
                ]}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  {...register('description')}
                  placeholder="Additional details about the asset..."
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
              Add Asset
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}