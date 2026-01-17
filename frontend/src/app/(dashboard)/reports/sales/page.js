'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Download, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import StatCard from '@/components/common/StatCard'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function SalesReportPage() {
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
      const response = await api.get('/reports/sales', {
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
      const response = await api.get(`/reports/sales/export`, {
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
      link.setAttribute('download', `sales-report.${format}`)
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
          { label: 'Sales Report' },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales Report</h1>
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
              title="Total Sales"
              value={formatCurrency(report.summary.total_sales)}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Total Orders"
              value={report.summary.total_orders}
              icon={ShoppingCart}
              color="blue"
            />
            <StatCard
              title="Average Order Value"
              value={formatCurrency(report.summary.average_order_value)}
              icon={TrendingUp}
              color="yellow"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{order.product_count} items</TableCell>
                      <TableCell className="text-right">{order.total_quantity}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell className="capitalize">{order.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.top_customers?.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-right">{customer.order_count}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(customer.total_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.top_products?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">{product.quantity_sold}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(product.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}