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
import StatCard from '@/components/common/StatCard'
import { DollarSign, Receipt, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    overdueCount: 0,
  })

  useEffect(() => {
    fetchInvoices()
    fetchStats()
  }, [pagination.page, searchQuery, statusFilter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await api.get('/invoices', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
          status: statusFilter,
        },
      })
      if (response.data.success) {
        setInvoices(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/invoices/stats')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const columns = [
    { id: 'invoice_number', header: 'Invoice #', accessor: 'invoice_number', sortable: true },
    { id: 'customer', header: 'Customer', accessor: 'customer_name' },
    { id: 'order', header: 'Order #', accessor: 'order_number' },
    { id: 'date', header: 'Invoice Date', accessor: 'invoice_date', cell: (row) => formatDate(row.invoice_date) },
    { id: 'due', header: 'Due Date', accessor: 'due_date', cell: (row) => formatDate(row.due_date) },
    { id: 'total', header: 'Total', accessor: 'total_amount', cell: (row) => formatCurrency(row.total_amount) },
    { id: 'paid', header: 'Paid', accessor: 'paid_amount', cell: (row) => formatCurrency(row.paid_amount) },
    { id: 'balance', header: 'Balance', accessor: 'balance', cell: (row) => formatCurrency(row.balance) },
    { id: 'status', header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button onClick={() => router.push('/invoices/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(stats.totalInvoiced)}
          icon={Receipt}
          color="blue"
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(stats.totalPaid)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.totalOutstanding)}
          icon={Receipt}
          color="yellow"
        />
        <StatCard
          title="Overdue"
          value={stats.overdueCount}
          icon={AlertCircle}
          color="red"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'sent', label: 'Sent' },
                    { value: 'paid', label: 'Paid' },
                    { value: 'partial', label: 'Partial' },
                    { value: 'overdue', label: 'Overdue' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
              <div className="w-80">
                <SearchBar
                  placeholder="Search invoices..."
                  onSearch={setSearchQuery}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={invoices}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => router.push(`/invoices/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}