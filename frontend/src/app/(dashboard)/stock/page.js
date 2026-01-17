'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, PackagePlus, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable from '@/components/common/DataTable'
import SearchBar from '@/components/common/SearchBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import api from '@/lib/api'
import { formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export default function StockPage() {
  const router = useRouter()
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  useEffect(() => {
    fetchStock()
  }, [pagination.page, searchQuery])

  const fetchStock = async () => {
    try {
      setLoading(true)
      const response = await api.get('/stock', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
        },
      })
      if (response.data.success) {
        setStock(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (current, minimum) => {
    if (current < minimum * 0.5) return 'critical'
    if (current < minimum) return 'low'
    return 'ok'
  }

  const columns = [
    { id: 'product', header: 'Product Name', accessor: 'product_name', sortable: true },
    { id: 'sku', header: 'SKU', accessor: 'sku' },
    { 
      id: 'current', 
      header: 'Current Stock', 
      accessor: 'current_stock',
      cell: (row) => {
        const status = getStockStatus(row.current_stock, row.minimum_stock)
        return (
          <span className={cn(
            'font-medium',
            status === 'critical' && 'text-red-600',
            status === 'low' && 'text-yellow-600',
            status === 'ok' && 'text-green-600'
          )}>
            {row.current_stock}
          </span>
        )
      }
    },
    { id: 'minimum', header: 'Minimum Level', accessor: 'minimum_stock' },
    { 
      id: 'status', 
      header: 'Status', 
      cell: (row) => {
        const status = getStockStatus(row.current_stock, row.minimum_stock)
        return (
          <Badge variant={
            status === 'critical' ? 'error' : 
            status === 'low' ? 'warning' : 
            'success'
          }>
            {status === 'critical' ? 'CRITICAL' : status === 'low' ? 'LOW' : 'OK'}
          </Badge>
        )
      }
    },
    { id: 'updated', header: 'Last Updated', accessor: 'updated_at', cell: (row) => formatDate(row.updated_at) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Management</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/stock/damage')}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Record Damage
          </Button>
          <Button onClick={() => router.push('/stock/grn')}>
            <PackagePlus className="w-4 h-4 mr-2" />
            New GRN
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="ghost"
          className="h-auto p-4 flex items-center justify-between border-2"
          onClick={() => router.push('/stock/grn')}
        >
          <div className="text-left">
            <p className="font-medium">Goods Received Note</p>
            <p className="text-sm text-gray-600">Add new stock</p>
          </div>
          <PackagePlus className="w-6 h-6 text-primary" />
        </Button>
        <Button
          variant="ghost"
          className="h-auto p-4 flex items-center justify-between border-2"
          onClick={() => router.push('/stock/damage')}
        >
          <div className="text-left">
            <p className="font-medium">Damage/Waste</p>
            <p className="text-sm text-gray-600">Record loss</p>
          </div>
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
        </Button>
        <Button
          variant="ghost"
          className="h-auto p-4 flex items-center justify-between border-2"
          onClick={() => router.push('/stock/transactions')}
        >
          <div className="text-left">
            <p className="font-medium">Transaction History</p>
            <p className="text-sm text-gray-600">View all movements</p>
          </div>
          <Plus className="w-6 h-6 text-blue-600" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Stock Levels</CardTitle>
            <div className="w-80">
              <SearchBar
                placeholder="Search stock..."
                onSearch={setSearchQuery}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={stock}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </CardContent>
      </Card>
    </div>
  )
}