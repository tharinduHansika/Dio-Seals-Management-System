'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Edit, FileText, Printer } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Breadcrumb from '@/components/layout/Breadcrumb'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Select from '@/components/ui/Select'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${params.id}`)
      if (response.data.success) {
        setOrder(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/orders/${params.id}/status`, { status: newStatus })
      toast.success('Order status updated')
      fetchOrder()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleCreateInvoice = async () => {
    try {
      const response = await api.post('/invoices', { order_id: params.id })
      if (response.data.success) {
        toast.success('Invoice created successfully')
        router.push(`/invoices/${response.data.data.id}`)
      }
    } catch (error) {
      toast.error('Failed to create invoice')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Orders', href: '/orders' },
          { label: order.order_number },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{order.order_number}</h1>
          <p className="text-gray-600 mt-1">{order.customer_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {!order.invoice_id && order.status !== 'cancelled' && (
            <Button onClick={handleCreateInvoice}>
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          )}
          <Button onClick={() => router.push(`/orders/${params.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-medium">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">{formatDate(order.order_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Delivery</p>
                  <p className="font-medium">{formatDate(order.expected_delivery)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={order.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <StatusBadge status={order.payment_status} />
                </div>
                {order.reference && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-medium">{order.reference}</p>
                  </div>
                )}
                {order.shipping_address && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <p className="text-gray-900">{order.shipping_address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.discount)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity * item.unit_price - item.discount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'in_production', label: 'In Production' },
                  { value: 'ready', label: 'Ready' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </CardContent>
          </Card>

          {order.special_instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order.special_instructions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}