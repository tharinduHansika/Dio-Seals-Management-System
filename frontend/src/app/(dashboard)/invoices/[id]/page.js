'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Printer, Send, DollarSign, Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Breadcrumb from '@/components/layout/Breadcrumb'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { PAYMENT_METHODS } from '@/lib/constants'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function InvoiceDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [invoice, setInvoice] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
  })

  useEffect(() => {
    fetchInvoice()
    fetchPayments()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${params.id}`)
      if (response.data.success) {
        setInvoice(response.data.data)
        setPaymentData(prev => ({ ...prev, amount: response.data.data.balance.toString() }))
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await api.get(`/payments/invoice/${params.id}`)
      if (response.data.success) {
        setPayments(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const handleRecordPayment = async () => {
    try {
      const response = await api.post('/payments', {
        invoice_id: parseInt(params.id),
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date,
        reference: paymentData.reference,
      })
      if (response.data.success) {
        toast.success('Payment recorded successfully')
        setShowPaymentModal(false)
        fetchInvoice()
        fetchPayments()
      }
    } catch (error) {
      toast.error('Failed to record payment')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/invoices/${params.id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${invoice.invoice_number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      toast.error('Failed to download PDF')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Invoices', href: '/invoices' },
          { label: invoice.invoice_number },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
          <p className="text-gray-600 mt-1">{invoice.customer_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="secondary" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="secondary">
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
          {invoice.balance > 0 && (
            <Button onClick={() => setShowPaymentModal(true)}>
              <DollarSign className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-medium">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-medium">{invoice.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{formatDate(invoice.due_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={invoice.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Terms</p>
                  <p className="font-medium">{invoice.payment_terms || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items?.map((item) => (
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span className="font-medium">{formatCurrency(invoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(invoice.balance)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="capitalize">{payment.payment_method}</TableCell>
                        <TableCell>{payment.reference || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid to Date</p>
                  <p className="text-xl font-medium text-green-600">{formatCurrency(invoice.paid_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Balance Remaining</p>
                  <p className="text-xl font-medium text-red-600">{formatCurrency(invoice.balance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{invoice.customer_name}</p>
                </div>
                {invoice.customer_email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm">{invoice.customer_email}</p>
                  </div>
                )}
                {invoice.customer_phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-sm">{invoice.customer_phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        <div className="space-y-4">
          <Input
            label="Payment Amount *"
            type="number"
            step="0.01"
            value={paymentData.amount}
            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
          />
          <Select
            label="Payment Method *"
            value={paymentData.payment_method}
            onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
            options={PAYMENT_METHODS}
          />
          <Input
            label="Payment Date *"
            type="date"
            value={paymentData.payment_date}
            onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
          />
          <Input
            label="Reference Number"
            value={paymentData.reference}
            onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
            placeholder="Check #, Transaction ID, etc."
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}