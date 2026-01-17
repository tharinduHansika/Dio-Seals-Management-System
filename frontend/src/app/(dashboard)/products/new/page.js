'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Breadcrumb from '@/components/layout/Breadcrumb'
import api from '@/lib/api'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().min(1, 'SKU is required').max(100),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(1000).optional(),
  unit_price: z.string().min(1, 'Unit price is required'),
  minimum_stock: z.string().min(1, 'Minimum stock is required'),
  status: z.enum(['active', 'inactive']),
})

export default function NewProductPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'active',
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/products', {
        ...data,
        unit_price: parseFloat(data.unit_price),
        minimum_stock: parseInt(data.minimum_stock),
      })
      if (response.data.success) {
        toast.success('Product created successfully')
        router.push('/products')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Products', href: '/products' },
          { label: 'New Product' },
        ]}
      />

      <h1 className="text-3xl font-bold">Create New Product</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Enter product name"
              />
              <Input
                label="SKU *"
                {...register('sku')}
                error={errors.sku?.message}
                placeholder="Enter SKU code"
              />
              <Input
                label="Category *"
                {...register('category')}
                error={errors.category?.message}
                placeholder="Enter category"
              />
              <Input
                label="Unit Price *"
                type="number"
                step="0.01"
                {...register('unit_price')}
                error={errors.unit_price?.message}
                placeholder="0.00"
              />
              <Input
                label="Minimum Stock Level *"
                type="number"
                {...register('minimum_stock')}
                error={errors.minimum_stock?.message}
                placeholder="Enter minimum stock"
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
              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  {...register('description')}
                  error={errors.description?.message}
                  placeholder="Enter product description"
                  rows={4}
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
              Create Product
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}