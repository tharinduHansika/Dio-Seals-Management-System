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
import Textarea from '@/components/ui/Textarea'
import Breadcrumb from '@/components/layout/Breadcrumb'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

const orderSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  order_date: z.string().min(1, 'Order date is required'),
  expected_delivery: z.string().min(1, 'Expected delivery is required'),
  reference: z.string().optional(),
  shipping_address: z.string().optional(),
  special_instructions: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity: z.string().min(1, 'Quantity is required'),
    unit_price: z.string().min(1, 'Unit price is required'),
    discount: z.string().optional(),
  })).min(1, 'At least one item is required'),
})

export default function NewOrderPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ product_id: '', quantity: '1', unit_price: '', discount: '0' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items')

  useEffect(() => {
    fetchCustomers()
    fetchProducts()
  }, [])

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
          price: p.unit_price,
          stock: p.current_stock 
        })))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const price = parseFloat(item.unit_price) || 0
      const discount = parseFloat(item.discount) || 0
      return sum + (quantity * price - discount)
    }, 0)
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

      const response = await api.post('/orders', payload)
      if (response.data.success) {
        toast.success('Order created successfully')
        router.push('/orders')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create order')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Orders', href: '/orders' },
          { label: 'New Order' },
        ]}
      />

      <h1 className="text-3xl font-bold">Create New Order</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
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
                label="Order Date *"
                type="date"
                {...register('order_date')}
                error={errors.order_date?.message}
              />
              <Input
                label="Expected Delivery *"
                type="date"
                {...register('expected_delivery')}
                error={errors.expected_delivery?.message}
              />
              <Input
                label="Reference/PO Number"
                {...register('reference')}
                placeholder="Optional reference"
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Shipping Address"
                  {...register('shipping_address')}
                  placeholder="Enter shipping address if different from customer default"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Items</CardTitle>
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
                        (parseFloat(items[index]?.quantity) || 0) * 
                        (parseFloat(items[index]?.unit_price) || 0) - 
                        (parseFloat(items[index]?.discount) || 0)
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
              label="Special Instructions"
              {...register('special_instructions')}
              placeholder="Any special requirements or instructions..."
              rows={3}
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
              Create Order
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}