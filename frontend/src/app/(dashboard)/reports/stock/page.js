'use client'
import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import StatCard from '@/components/common/StatCard'
import { Package, AlertTriangle, TrendingUp } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function StockReportPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const response = await api.get('/reports/stock')
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
      const response = await api.get(`/reports/stock/export`, {
        params: { format },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `stock-report.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Report exported successfully')
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const getStockStatus = (current, minimum) => {
    if (current < minimum * 0.5) return 'critical'
    if (current < minimum) return 'low'
    return 'ok'
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
          { label: 'Reports', href: '/reports' },
          { label: 'Stock Report' },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Report</h1>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Stock Value"
          value={formatCurrency(report?.summary?.total_value || 0)}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={report?.summary?.low_stock_count || 0}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Stock Items"
          value={report?.summary?.total_products || 0}
          icon={TrendingUp}
          color="green"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Minimum</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report?.products?.map((product) => {
                const status = getStockStatus(product.current_stock, product.minimum_stock)
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell className={cn(
                      'text-right font-medium',
                      status === 'critical' && 'text-red-600',
                      status === 'low' && 'text-yellow-600',
                      status === 'ok' && 'text-green-600'
                    )}>
                      {product.current_stock}
                    </TableCell>
                    <TableCell className="text-right">{product.minimum_stock}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.stock_value)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        status === 'critical' ? 'error' : 
                        status === 'low' ? 'warning' : 
                        'success'
                      }>
                        {status === 'critical' ? 'CRITICAL' : status === 'low' ? 'LOW' : 'OK'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}