'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

const quotationSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  quote_date: z.string().min(1, 'Quote date is required'),
  valid_until: z.string().min(1, 'Valid until date is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity: z.string().min(1, 'Quantity is required'),
    unit_price: z.string().min(1, 'Unit price is required'),
    discount: z.string().optional(),
  })).min(1, 'At least one item is required'),
})

export default function EditQuotationPage() {
  const router = useRouter()
  const params = useParams()
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(quotationSchema),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items')

  useEffect(() => {
    fetchCustomers()
    fetchProducts()
    fetchQuotation()
  }, [params.id])

  const fetchQuotation = async () => {
    try {
      const response = await api.get(`/quotations/${params.id}`)
      if (response.data.success) {
        const quotation = response.data.data
        reset({
          customer_id: quotation.customer_id.toString(),
          quote_date: quotation.quote_date.split('T')[0],
          valid_until: quotation.valid_until.split('T')[0],
          reference: quotation.reference || '',
          notes: quotation.notes || '',
          items: quotation.items.map(item => ({
            product_id: item.product_id.toString(),
            quantity: item.quantity.toString(),
            unit_price: item.unit_price.toString(),
            discount: item.discount.toString(),
          })),
        })
      }
    } catch (error) {
      console.error('Error fetching quotation:', error)
      toast.error('Failed to load quotation')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers')
      if (response.data.success) {
        setCustomers(response.data.data.map(c => ({ value: c.id.toString(), label: c.name })))
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products')
      if (response.data.success) {
        setProducts(response.data.data.map(p => ({ 
          value: p.id.toString(), 
          label: `${p.name} (${p.sku})`,
          price: p.unit_price 
        })))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const calculateSubtotal = () => {
    return items?.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const price = parseFloat(item.unit_price) || 0
      const discount = parseFloat(item.discount) || 0
      return sum + (quantity * price - discount)
    }, 0) || 0
  }

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        customer_id: parseInt(data.customer_id),
        items: data.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          discount: parseFloat(item.discount) || 0,
        })),
      }

      const response = await api.put(`/quotations/${params.id}`, payload)
      if (response.data.success) {
        toast.success('Quotation updated successfully')
        router.push(`/quotations/${params.id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update quotation')
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
          { label: 'Quotations', href: '/quotations' },
          { label: 'Edit Quotation' },
        ]}
      />

      <h1 className="text-3xl font-bold">Edit Quotation</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Customer *"
                {...register('customer_id')}
                error={errors.customer_id?.message}
                options={customers}
              />
              <Input
                label="Quote Date *"
                type="date"
                {...register('quote_date')}
                error={errors.quote_date?.message}
              />
              <Input
                label="Valid Until *"
                type="date"
                {...register('valid_until')}
                error={errors.valid_until?.message}
              />
              <Input
                label="Reference Number"
                {...register('reference')}
                placeholder="Optional reference"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={() => append({ product_id: '', quantity: '1', unit_price: '', discount: '0' })}
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
                  <div className="col-span-4">
                    <Select
                      label="Product *"
                      {...register(`items.${index}.product_id`)}
                      error={errors.items?.[index]?.product_id?.message}
                      options={products}
                      onChange={(e) => {
                        const product = products.find(p => p.value === e.target.value)
                        if (product) {
                          const event = { target: { value: product.price.toString() } }
                          register(`items.${index}.unit_price`).onChange(event)
                        }
                      }}
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
                  <div className="col-span-2">
                    <Input
                      label="Unit Price *"
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unit_price`)}
                      error={errors.items?.[index]?.unit_price?.message}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      label="Discount"
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.discount`)}
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <p className="text-sm font-medium mb-2">
                      {formatCurrency(
                        (parseFloat(items?.[index]?.quantity) || 0) * 
                        (parseFloat(items?.[index]?.unit_price) || 0) - 
                        (parseFloat(items?.[index]?.discount) || 0)
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
                  <span>Total:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              label="Notes"
              {...register('notes')}
              placeholder="Terms and conditions, special notes..."
              rows={4}
            />
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
              Update Quotation
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}