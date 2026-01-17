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

export default function QuotationsPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  useEffect(() => {
    fetchQuotations()
  }, [pagination.page, searchQuery, statusFilter])

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/quotations', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
          status: statusFilter,
        },
      })
      if (response.data.success) {
        setQuotations(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { id: 'quote_number', header: 'Quote #', accessor: 'quote_number', sortable: true },
    { id: 'customer', header: 'Customer', accessor: 'customer_name' },
    { id: 'date', header: 'Date', accessor: 'quote_date', cell: (row) => formatDate(row.quote_date) },
    { id: 'valid_until', header: 'Valid Until', accessor: 'valid_until', cell: (row) => formatDate(row.valid_until) },
    { id: 'total', header: 'Total', accessor: 'total_amount', cell: (row) => formatCurrency(row.total_amount) },
    { id: 'status', header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quotations</h1>
        <Button onClick={() => router.push('/quotations/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Quotation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quotation List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'sent', label: 'Sent' },
                    { value: 'accepted', label: 'Accepted' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'expired', label: 'Expired' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
              <div className="w-80">
                <SearchBar
                  placeholder="Search quotations..."
                  onSearch={setSearchQuery}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={quotations}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => router.push(`/quotations/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}