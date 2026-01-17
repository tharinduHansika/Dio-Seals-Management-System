'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Download, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import StatCard from '@/components/common/StatCard'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function FinancialReportPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      period: 'monthly',
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    },
  })

  const watchPeriod = watch('period')

  useEffect(() => {
    handleSubmit(onSubmit)()
  }, [])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const response = await api.get('/reports/financial', {
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

  const handleExport = async () => {
    try {
      const response = await api.get(`/reports/financial/export`, {
        params: report.filters,
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `financial-report.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Report exported successfully')
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const isProfit = (report?.summary?.net_profit || 0) >= 0

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Reports', href: '/reports' },
          { label: 'Financial Report' },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial Report</h1>
        {report && (
          <Button variant="secondary" onClick={handleExport}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-4">
            <Select
              label="Period"
              {...register('period')}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
            <Select
              label="Year"
              {...register('year')}
              options={Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i
                return { value: year.toString(), label: year.toString() }
              })}
            />
            {watchPeriod === 'monthly' && (
              <Select
                label="Month"
                {...register('month')}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: (i + 1).toString().padStart(2, '0'),
                  label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
                }))}
              />
            )}
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
              title="Total Revenue"
              value={formatCurrency(report.summary.total_revenue)}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Total Expenses"
              value={formatCurrency(report.summary.total_expenses)}
              icon={TrendingDown}
              color="red"
            />
            <StatCard
              title="Net Profit/Loss"
              value={formatCurrency(Math.abs(report.summary.net_profit))}
              icon={DollarSign}
              color={isProfit ? 'green' : 'red'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Sales Revenue</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.revenue.sales)}</TableCell>
                    </TableRow>
                    {report.revenue.other > 0 && (
                      <TableRow>
                        <TableCell className="font-medium">Other Income</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.revenue.other)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>Total Revenue</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.summary.total_revenue)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.expenses?.map((expense) => (
                      <TableRow key={expense.category}>
                        <TableCell className="font-medium capitalize">{expense.category.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(expense.total)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>Total Expenses</TableCell>
                      <TableCell className="text-right">{formatCurrency(report.summary.total_expenses)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-medium">{formatCurrency(report.summary.total_revenue)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Expenses</span>
                  <span className="font-medium">({formatCurrency(report.summary.total_expenses)})</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-300">
                  <span className="text-lg font-bold">Net {isProfit ? 'Profit' : 'Loss'}</span>
                  <span className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(report.summary.net_profit))}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm text-gray-600">
                  <span>Profit Margin</span>
                  <span>{report.summary.profit_margin}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}