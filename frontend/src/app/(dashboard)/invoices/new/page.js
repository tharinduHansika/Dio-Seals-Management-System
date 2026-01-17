'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

const invoiceSchema = z.object({
  order_id: z.string().min(1, 'Order is required'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  payment_terms: z.string().optional(),
})

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_terms: 'Net 30',
    },
  })

  const watchOrderId = watch('order_id')

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (orderId) {
      setValue('order_id', orderId)
    }
  }, [orderId])

  useEffect(() => {
    if (watchOrderId) {
      fetchOrderDetails(watchOrderId)
    }
  }, [watchOrderId])

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders', { params: { status: 'delivered' } })
      if (response.data.success) {
        setOrders(response.data.data.map(o => ({ 
          value: o.id.toString(), 
          label: `${o.order_number} - ${o.customer_name}` 
        })))
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`)
      if (response.data.success) {
        setSelectedOrder(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    }
  }

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/invoices', {
        ...data,
        order_id: parseInt(data.order_id),
      })
      if (response.data.success) {
        toast.success('Invoice created successfully')
        router.push(`/invoices/${response.data.data.id}`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Invoices', href: '/invoices' },
          { label: 'New Invoice' },
        ]}
      />

      <h1 className="text-3xl font-bold">Create New Invoice</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Select Order *"
                {...register('order_id')}
                error={errors.order_id?.message}
                options={orders}
              />
              <Input
                label="Invoice Date *"
                type="date"
                {...register('invoice_date')}
                error={errors.invoice_date?.message}
              />
              <Input
                label="Due Date *"
                type="date"
                {...register('due_date')}
                error={errors.due_date?.message}
              />
              <Input
                label="Payment Terms"
                {...register('payment_terms')}
                placeholder="e.g., Net 30"
              />
            </div>
          </CardContent>
        </Card>

        {selectedOrder && (
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-medium">{selectedOrder.order_number}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity * item.unit_price - item.discount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!selectedOrder}>
              Create Invoice
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}