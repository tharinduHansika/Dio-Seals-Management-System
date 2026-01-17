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
import Select from '@/components/ui/Select'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
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

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
  })

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${params.id}`)
      if (response.data.success) {
        const product = response.data.data
        reset({
          name: product.name,
          sku: product.sku,
          category: product.category,
          description: product.description || '',
          unit_price: product.unit_price.toString(),
          minimum_stock: product.minimum_stock.toString(),
          status: product.status,
        })
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      const response = await api.put(`/products/${params.id}`, {
        ...data,
        unit_price: parseFloat(data.unit_price),
        minimum_stock: parseInt(data.minimum_stock),
      })
      if (response.data.success) {
        toast.success('Product updated successfully')
        router.push(`/products/${params.id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product')
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
          { label: 'Products', href: '/products' },
          { label: 'Edit Product' },
        ]}
      />

      <h1 className="text-3xl font-bold">Edit Product</h1>

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
              />
              <Input
                label="SKU *"
                {...register('sku')}
                error={errors.sku?.message}
              />
              <Input
                label="Category *"
                {...register('category')}
                error={errors.category?.message}
              />
              <Input
                label="Unit Price *"
                type="number"
                step="0.01"
                {...register('unit_price')}
                error={errors.unit_price?.message}
              />
              <Input
                label="Minimum Stock Level *"
                type="number"
                {...register('minimum_stock')}
                error={errors.minimum_stock?.message}
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
              Update Product
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}