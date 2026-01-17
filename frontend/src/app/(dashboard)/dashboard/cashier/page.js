'use client'
import { useEffect, useState } from 'react'
import { DollarSign, Receipt, Wallet, Clock } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import DataTable from '@/components/common/DataTable'
import api from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function CashierDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    paymentsToday: 0,
    pendingInvoices: 0,
    cashOnHand: 0,
    overduePayments: 0,
  })
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/cashier')
      if (response.data.success) {
        setStats(response.data.data.stats || stats)
        setRecentPayments(response.data.data.recentPayments || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const paymentColumns = [
    { id: 'invoice', header: 'Invoice #', accessor: 'invoice_number' },
    { id: 'customer', header: 'Customer', accessor: 'customer_name' },
    { id: 'amount', header: 'Amount', accessor: 'amount', cell: (row) => formatCurrency(row.amount) },
    { id: 'method', header: 'Method', accessor: 'payment_method' },
    { id: 'time', header: 'Time', accessor: 'created_at', cell: (row) => formatDateTime(row.created_at) },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Cashier Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Payments Today"
          value={formatCurrency(stats.paymentsToday)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Pending Invoices"
          value={formatCurrency(stats.pendingInvoices)}
          icon={Receipt}
          color="yellow"
        />
        <StatCard
          title="Cash on Hand"
          value={formatCurrency(stats.cashOnHand)}
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Overdue Payments"
          value={formatCurrency(stats.overduePayments)}
          icon={Clock}
          color="red"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={paymentColumns}
            data={recentPayments}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}