'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import DataTable from '@/components/common/DataTable'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function AccountantDashboard() {
  const [stats, setStats] = useState({
    revenueThisMonth: 0,
    expensesThisMonth: 0,
    netProfit: 0,
    outstandingReceivables: 0,
  })
  const [recentExpenses, setRecentExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/accountant')
      if (response.data.success) {
        setStats(response.data.data.stats || stats)
        setRecentExpenses(response.data.data.recentExpenses || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const expenseColumns = [
    { id: 'date', header: 'Date', accessor: 'expense_date', cell: (row) => formatDate(row.expense_date) },
    { id: 'category', header: 'Category', accessor: 'category' },
    { id: 'description', header: 'Description', accessor: 'description' },
    { id: 'amount', header: 'Amount', accessor: 'amount', cell: (row) => formatCurrency(row.amount) },
  ]

  const isProfit = stats.netProfit >= 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Accountant Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(stats.revenueThisMonth)}
          icon={TrendingUp}
          color="green"
          trend="up"
          trendValue="+8.5%"
        />
        <StatCard
          title="Expenses This Month"
          value={formatCurrency(stats.expensesThisMonth)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Net Profit/Loss"
          value={formatCurrency(Math.abs(stats.netProfit))}
          icon={DollarSign}
          color={isProfit ? 'green' : 'red'}
        />
        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(stats.outstandingReceivables)}
          icon={Receipt}
          color="yellow"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={expenseColumns}
            data={recentExpenses}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}