'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid, List } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable from '@/components/common/DataTable'
import SearchBar from '@/components/common/SearchBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import StatusBadge from '@/components/common/StatusBadge'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('table')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  useEffect(() => {
    fetchProducts()
  }, [pagination.page, searchQuery])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
        },
      })
      if (response.data.success) {
        setProducts(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { id: 'name', header: 'Product Name', accessor: 'name', sortable: true },
    { id: 'sku', header: 'SKU', accessor: 'sku' },
    { id: 'category', header: 'Category', accessor: 'category' },
    { id: 'price', header: 'Unit Price', accessor: 'unit_price', cell: (row) => formatCurrency(row.unit_price) },
    { 
      id: 'stock', 
      header: 'Current Stock', 
      accessor: 'current_stock',
      cell: (row) => (
        <span className={cn(
          'font-medium',
          row.current_stock < row.minimum_stock ? 'text-red-600' : 'text-green-600'
        )}>
          {row.current_stock}
        </span>
      )
    },
    { id: 'status', header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => router.push('/products/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-80">
                <SearchBar
                  placeholder="Search products..."
                  onSearch={setSearchQuery}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <DataTable
              columns={columns}
              data={products}
              loading={loading}
              pagination={pagination}
              onPaginationChange={setPagination}
              onRowClick={(row) => router.push(`/products/${row.id}`)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="card cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                    <StatusBadge status={product.status} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-600 mb-2">Category: {product.category}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(product.unit_price)}
                    </span>
                    <span className={cn(
                      'text-sm font-medium',
                      product.current_stock < product.minimum_stock ? 'text-red-600' : 'text-green-600'
                    )}>
                      Stock: {product.current_stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}