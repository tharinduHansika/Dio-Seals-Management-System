'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/common/DataTable'
import SearchBar from '@/components/common/SearchBar'
import Select from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import StatCard from '@/components/common/StatCard'
import { DollarSign, CreditCard, Banknote } from 'lucide-react'
import { PAYMENT_METHODS } from '@/lib/constants'
import api from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/formatters'

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [stats, setStats] = useState({
    totalCollected: 0,
    cashTotal: 0,
    bankTotal: 0,
    cardTotal: 0,
  })

  useEffect(() => {
    fetchPayments()
    fetchStats()
  }, [pagination.page, searchQuery, methodFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/payments', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
          payment_method: methodFilter,
        },
      })
      if (response.data.success) {
        setPayments(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/payments/stats')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const columns = [
    { id: 'id', header: 'Payment ID', accessor: 'id' },
    { id: 'date', header: 'Date', accessor: 'payment_date', cell: (row) => formatDateTime(row.payment_date) },
    { id: 'customer', header: 'Customer', accessor: 'customer_name' },
    { id: 'invoice', header: 'Invoice #', accessor: 'invoice_number' },
    { id: 'amount', header: 'Amount', accessor: 'amount', cell: (row) => formatCurrency(row.amount) },
    { id: 'method', header: 'Method', accessor: 'payment_method', cell: (row) => (
      <span className="capitalize">{row.payment_method}</span>
    )},
    { id: 'reference', header: 'Reference', accessor: 'reference' },
    { id: 'received_by', header: 'Received By', accessor: 'received_by' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Collected"
          value={formatCurrency(stats.totalCollected)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Cash Payments"
          value={formatCurrency(stats.cashTotal)}
          icon={Banknote}
          color="blue"
        />
        <StatCard
          title="Bank Transfers"
          value={formatCurrency(stats.bankTotal)}
          icon={CreditCard}
          color="yellow"
        />
        <StatCard
          title="Card Payments"
          value={formatCurrency(stats.cardTotal)}
          icon={CreditCard}
          color="blue"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select
                  options={[
                    { value: '', label: 'All Methods' },
                    ...PAYMENT_METHODS,
                  ]}
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                />
              </div>
              <div className="w-80">
                <SearchBar
                  placeholder="Search payments..."
                  onSearch={setSearchQuery}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={payments}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => router.push(`/payments/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}