'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable from '@/components/common/DataTable'
import SearchBar from '@/components/common/SearchBar'
import Select from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import StatCard from '@/components/common/StatCard'
import { TrendingDown, DollarSign } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [stats, setStats] = useState({
    totalExpenses: 0,
    thisMonth: 0,
  })

  useEffect(() => {
    fetchExpenses()
    fetchStats()
  }, [pagination.page, searchQuery, categoryFilter])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/expenses', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
          category: categoryFilter,
        },
      })
      if (response.data.success) {
        setExpenses(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/expenses/stats')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const columns = [
    { id: 'date', header: 'Date', accessor: 'expense_date', cell: (row) => formatDate(row.expense_date), sortable: true },
    { id: 'category', header: 'Category', accessor: 'category', cell: (row) => (
      <span className="capitalize">{row.category.replace(/_/g, ' ')}</span>
    )},
    { id: 'description', header: 'Description', accessor: 'description' },
    { id: 'amount', header: 'Amount', accessor: 'amount', cell: (row) => formatCurrency(row.amount) },
    { id: 'method', header: 'Payment Method', accessor: 'payment_method', cell: (row) => (
      <span className="capitalize">{row.payment_method}</span>
    )},
    { id: 'vendor', header: 'Vendor', accessor: 'vendor' },
    { id: 'by', header: 'Added By', accessor: 'added_by' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button onClick={() => router.push('/expenses/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Record Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.thisMonth)}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expense List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select
                  options={[
                    { value: '', label: 'All Categories' },
                    ...EXPENSE_CATEGORIES,
                  ]}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                />
              </div>
              <div className="w-80">
                <SearchBar
                  placeholder="Search expenses..."
                  onSearch={setSearchQuery}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={expenses}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => router.push(`/expenses/${row.id}/edit`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}