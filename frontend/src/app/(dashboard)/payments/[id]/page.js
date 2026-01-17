'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Printer } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import api from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function PaymentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayment()
  }, [params.id])

  const fetchPayment = async () => {
    try {
      const response = await api.get(`/payments/${params.id}`)
      if (response.data.success) {
        setPayment(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching payment:', error)
      toast.error('Failed to load payment')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Payment not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Payments', href: '/payments' },
          { label: `Payment #${payment.id}` },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Details</h1>
          <p className="text-gray-600 mt-1">Payment ID: {payment.id}</p>
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Date</p>
                  <p className="font-medium">{formatDateTime(payment.payment_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium text-2xl text-green-600">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{payment.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-medium">{payment.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium capitalize">{payment.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reference Number</p>
                  <p className="font-medium">{payment.reference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Received By</p>
                  <p className="font-medium">{payment.received_by}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-medium">{formatDateTime(payment.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-4 border-b">
                  <p className="text-sm text-gray-600 mb-2">Amount Paid</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice Total</p>
                  <p className="text-lg font-medium">{formatCurrency(payment.invoice_total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Previous Payments</p>
                  <p className="text-lg font-medium">{formatCurrency(payment.previous_payments)}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Balance Remaining</p>
                  <p className="text-lg font-bold">{formatCurrency(payment.balance_remaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}