'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable from '@/components/common/DataTable'
import SearchBar from '@/components/common/SearchBar'
import Select from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import StatusBadge from '@/components/common/StatusBadge'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, searchQuery, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.get('/orders', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
          status: statusFilter,
        },
      })
      if (response.data.success) {
        setOrders(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { id: 'order_number', header: 'Order #', accessor: 'order_number', sortable: true },
    { id: 'customer', header: 'Customer', accessor: 'customer_name' },
    { id: 'date', header: 'Order Date', accessor: 'order_date', cell: (row) => formatDate(row.order_date) },
    { id: 'total', header: 'Total Amount', accessor: 'total_amount', cell: (row) => formatCurrency(row.total_amount) },
    { id: 'status', header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
    { 
      id: 'payment_status', 
      header: 'Payment', 
      accessor: 'payment_status', 
      cell: (row) => <StatusBadge status={row.payment_status} /> 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Button onClick={() => router.push('/orders/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'in_production', label: 'In Production' },
                    { value: 'ready', label: 'Ready' },
                    { value: 'delivered', label: 'Delivered' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
              <div className="w-80">
                <SearchBar
                  placeholder="Search orders..."
                  onSearch={setSearchQuery}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => router.push(`/orders/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}