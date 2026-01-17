'use client'
import { useEffect, useState } from 'react'
import { DollarSign, ShoppingCart, FileText, AlertTriangle } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import DataTable from '@/components/common/DataTable'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function DirectorDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    pendingQuotations: 0,
    lowStockAlerts: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/director')
      if (response.data.success) {
        setStats(response.data.data.stats || stats)
        setRecentOrders(response.data.data.recentOrders || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const orderColumns = [
    { id: 'order_number', header: 'Order #', accessor: 'order_number' },
    { id: 'customer', header: 'Customer', accessor: 'customer_name' },
    { id: 'total', header: 'Total', accessor: 'total_amount', cell: (row) => formatCurrency(row.total_amount) },
    { id: 'status', header: 'Status', accessor: 'status' },
    { id: 'date', header: 'Date', accessor: 'order_date', cell: (row) => formatDate(row.order_date) },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Director Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="green"
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Pending Quotations"
          value={stats.pendingQuotations}
          icon={FileText}
          color="yellow"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockAlerts}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={orderColumns}
            data={recentOrders}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}