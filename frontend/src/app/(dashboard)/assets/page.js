'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable from '@/components/common/DataTable'
import SearchBar from '@/components/common/SearchBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function AssetsPage() {
  const router = useRouter()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  useEffect(() => {
    fetchAssets()
  }, [pagination.page, searchQuery])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/assets', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
        },
      })
      if (response.data.success) {
        setAssets(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { id: 'name', header: 'Asset Name', accessor: 'name', sortable: true },
    { id: 'category', header: 'Category', accessor: 'category', cell: (row) => (
      <span className="capitalize">{row.category}</span>
    )},
    { id: 'purchase_date', header: 'Purchase Date', accessor: 'purchase_date', cell: (row) => formatDate(row.purchase_date) },
    { id: 'purchase_cost', header: 'Purchase Cost', accessor: 'purchase_cost', cell: (row) => formatCurrency(row.purchase_cost) },
    { id: 'current_value', header: 'Current Value', accessor: 'current_value', cell: (row) => formatCurrency(row.current_value) },
    { id: 'location', header: 'Location', accessor: 'location' },
    { id: 'status', header: 'Status', accessor: 'status', cell: (row) => (
      <span className="capitalize">{row.status}</span>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assets</h1>
        <Button onClick={() => router.push('/assets/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Asset List</CardTitle>
            <div className="w-80">
              <SearchBar
                placeholder="Search assets..."
                onSearch={setSearchQuery}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={assets}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </CardContent>
      </Card>
    </div>
  )
}