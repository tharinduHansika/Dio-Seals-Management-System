'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/common/DataTable'
import SearchBar from '@/components/common/SearchBar'
import Select from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Breadcrumb from '@/components/layout/Breadcrumb'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/formatters'

export default function StockTransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  useEffect(() => {
    fetchTransactions()
  }, [pagination.page, searchQuery, typeFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/stock/transactions', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
          type: typeFilter,
        },
      })
      if (response.data.success) {
        setTransactions(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionBadge = (type) => {
    const types = {
      grn: { variant: 'success', label: 'GRN' },
      damage: { variant: 'error', label: 'DAMAGE' },
      allocation: { variant: 'info', label: 'ALLOCATION' },
      adjustment: { variant: 'warning', label: 'ADJUSTMENT' },
    }
    const config = types[type] || { variant: 'default', label: type?.toUpperCase() }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const columns = [
    { id: 'date', header: 'Date', accessor: 'created_at', cell: (row) => formatDateTime(row.created_at) },
    { id: 'product', header: 'Product', accessor: 'product_name' },
    { id: 'type', header: 'Type', accessor: 'transaction_type', cell: (row) => getTransactionBadge(row.transaction_type) },
    { 
      id: 'quantity', 
      header: 'Quantity', 
      accessor: 'quantity',
      cell: (row) => (
        <span className={row.transaction_type === 'grn' ? 'text-green-600' : 'text-red-600'}>
          {row.transaction_type === 'grn' ? '+' : '-'}{row.quantity}
        </span>
      )
    },
    { id: 'balance', header: 'Balance After', accessor: 'balance_after' },
    { id: 'user', header: 'User', accessor: 'user_name' },
    { id: 'reference', header: 'Reference', accessor: 'reference' },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Stock', href: '/stock' },
          { label: 'Transaction History' },
        ]}
      />

      <h1 className="text-3xl font-bold">Stock Transaction History</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Transactions</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select
                  options={[
                    { value: '', label: 'All Types' },
                    { value: 'grn', label: 'GRN' },
                    { value: 'damage', label: 'Damage' },
                    { value: 'allocation', label: 'Allocation' },
                    { value: 'adjustment', label: 'Adjustment' },
                  ]}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                />
              </div>
              <div className="w-80">
                <SearchBar
                  placeholder="Search transactions..."
                  onSearch={setSearchQuery}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transactions}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </CardContent>
      </Card>
    </div>
  )
}