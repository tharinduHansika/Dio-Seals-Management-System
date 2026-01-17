'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Download, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import StatCard from '@/components/common/StatCard'
import { DollarSign, CreditCard, Banknote } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function PaymentsReportPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    handleSubmit(onSubmit)()
  }, [])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const response = await api.get('/reports/payments', {
        params: data,
      })
      if (response.data.success) {
        setReport(response.data.data)
      }
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/reports/payments/export`, {
        params: {
          format,
          start_date: report.filters.start_date,
          end_date: report.filters.end_date,
        },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `payments-report.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Report exported successfully')
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Reports', href: '/reports' },
          { label: 'Payments Report' },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payments Report</h1>
        {report && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="secondary" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-4">
            <Input
              label="Start Date"
              type="date"
              {...register('start_date')}
            />
            <Input
              label="End Date"
              type="date"
              {...register('end_date')}
            />
            <Button type="submit" loading={loading}>
              Generate Report
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Collected"
              value={formatCurrency(report.summary.total_collected)}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Cash Payments"
              value={formatCurrency(report.summary.cash_total)}
              icon={Banknote}
              color="blue"
            />
            <StatCard
              title="Bank/Card Payments"
              value={formatCurrency(report.summary.electronic_total)}
              icon={CreditCard}
              color="yellow"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.payments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{payment.customer_name}</TableCell>
                      <TableCell className="font-medium">{payment.invoice_number}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>{payment.reference || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.by_method?.map((method) => (
                  <div key={method.payment_method} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{method.payment_method}</p>
                      <p className="text-sm text-gray-600">{method.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(method.total)}</p>
                      <p className="text-sm text-gray-600">
                        {((method.total / report.summary.total_collected) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}