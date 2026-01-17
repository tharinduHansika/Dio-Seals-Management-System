'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable from '@/components/common/DataTable'
import SearchBar from '@/components/common/SearchBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import api from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/formatters'

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  useEffect(() => {
    fetchCustomers()
  }, [pagination.page, searchQuery])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/customers', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
        },
      })
      if (response.data.success) {
        setCustomers(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { id: 'name', header: 'Customer Name', accessor: 'name', sortable: true },
    { id: 'contact', header: 'Contact Person', accessor: 'contact_person' },
    { id: 'email', header: 'Email', accessor: 'email' },
    { id: 'phone', header: 'Phone', accessor: 'phone' },
    { id: 'city', header: 'City', accessor: 'city' },
    { id: 'created', header: 'Created', accessor: 'created_at', cell: (row) => formatDate(row.created_at) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button onClick={() => router.push('/customers/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer List</CardTitle>
            <div className="w-80">
              <SearchBar
                placeholder="Search customers..."
                onSearch={setSearchQuery}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={customers}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => router.push(`/customers/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}