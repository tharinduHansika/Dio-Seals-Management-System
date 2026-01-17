'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Breadcrumb from '@/components/layout/Breadcrumb'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

const grnSchema = z.object({
  grn_date: z.string().min(1, 'GRN date is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  reference: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity: z.string().min(1, 'Quantity is required'),
    unit_cost: z.string().optional(),
  })).min(1, 'At least one item is required'),
})

export default function NewGRNPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      grn_date: new Date().toISOString().split('T')[0],
      items: [{ product_id: '', quantity: '', unit_cost: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items')

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

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const cost = parseFloat(item.unit_cost) || 0
      return sum + (quantity * cost)
    }, 0)
  }

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        items: data.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost) || 0,
        })),
      }

      const response = await api.post('/stock/grn', payload)
      if (response.data.success) {
        toast.success('GRN created successfully')
        router.push('/stock')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create GRN')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Stock', href: '/stock' },
          { label: 'New GRN' },
        ]}
      />

      <h1 className="text-3xl font-bold">Goods Received Note (GRN)</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>GRN Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="GRN Date *"
                type="date"
                {...register('grn_date')}
                error={errors.grn_date?.message}
              />
              <Input
                label="Supplier *"
                {...register('supplier')}
                error={errors.supplier?.message}
                placeholder="Enter supplier name"
              />
              <Input
                label="Reference/Invoice #"
                {...register('reference')}
                placeholder="Optional reference"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items Received</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={() => append({ product_id: '', quantity: '', unit_cost: '' })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg">
                  <div className="col-span-5">
                    <Select
                      label="Product *"
                      {...register(`items.${index}.product_id`)}
                      error={errors.items?.[index]?.product_id?.message}
                      options={products}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Quantity *"
                      type="number"
                      {...register(`items.${index}.quantity`)}
                      error={errors.items?.[index]?.quantity?.message}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      label="Unit Cost"
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unit_cost`)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <p className="text-sm font-medium mb-2">
                      {formatCurrency(
                        (parseFloat(items[index]?.quantity) || 0) * 
                        (parseFloat(items[index]?.unit_cost) || 0)
                      )}
                    </p>
                  </div>
                  <div className="col-span-1 flex items-end">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Cost:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
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
              Create GRN
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}