'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Edit, Download, Send, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Breadcrumb from '@/components/layout/Breadcrumb'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function QuotationDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotation()
  }, [params.id])

  const fetchQuotation = async () => {
    try {
      const response = await api.get(`/quotations/${params.id}`)
      if (response.data.success) {
        setQuotation(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching quotation:', error)
      toast.error('Failed to load quotation')
    } finally {
      setLoading(false)
    }
  }

  const handleConvertToOrder = async () => {
    try {
      const response = await api.post(`/quotations/${params.id}/convert`)
      if (response.data.success) {
        toast.success('Quotation converted to order successfully')
        router.push(`/orders/${response.data.data.order_id}`)
      }
    } catch (error) {
      toast.error('Failed to convert quotation')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/quotations/${params.id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `quotation-${quotation.quote_number}.pdf`)
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

  if (!quotation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Quotation not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Quotations', href: '/quotations' },
          { label: quotation.quote_number },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{quotation.quote_number}</h1>
          <p className="text-gray-600 mt-1">{quotation.customer_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="secondary">
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
          {quotation.status === 'accepted' && (
            <Button onClick={handleConvertToOrder}>
              <FileText className="w-4 h-4 mr-2" />
              Convert to Order
            </Button>
          )}
          {quotation.status === 'draft' && (
            <Button onClick={() => router.push(`/quotations/${params.id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Quotation Number</p>
                  <p className="font-medium">{quotation.quote_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{quotation.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quote Date</p>
                  <p className="font-medium">{formatDate(quotation.quote_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valid Until</p>
                  <p className="font-medium">{formatDate(quotation.valid_until)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={quotation.status} />
                </div>
                {quotation.reference && (
                  <div>
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-medium">{quotation.reference}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
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
                  {quotation.items?.map((item) => (
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
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(quotation.total_amount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(quotation.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="text-lg font-medium">{quotation.items?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {quotation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}