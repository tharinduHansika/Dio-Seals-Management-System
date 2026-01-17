'use client'
import { useEffect, useState } from 'react'
import { Package, AlertTriangle, TrendingUp, Clipboard } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import DataTable from '@/components/common/DataTable'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function StorekeeperDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalStockValue: 0,
    lowStockItems: 0,
    stockMovements: 0,
    pendingGRNs: 0,
  })
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/storekeeper')
      if (response.data.success) {
        setStats(response.data.data.stats || stats)
        setLowStockAlerts(response.data.data.lowStockAlerts || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stockColumns = [
    { id: 'product', header: 'Product', accessor: 'product_name' },
    { id: 'current', header: 'Current', accessor: 'current_stock' },
    { id: 'minimum', header: 'Minimum', accessor: 'minimum_stock' },
    { 
      id: 'shortage', 
      header: 'Shortage', 
      cell: (row) => row.minimum_stock - row.current_stock 
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button size="sm" onClick={() => router.push(`/stock/grn`)}>
          Reorder
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Storekeeper Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Stock Value"
          value={formatCurrency(stats.totalStockValue)}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Stock Movements Today"
          value={stats.stockMovements}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Pending GRNs"
          value={stats.pendingGRNs}
          icon={Clipboard}
          color="yellow"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={stockColumns}
            data={lowStockAlerts}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}