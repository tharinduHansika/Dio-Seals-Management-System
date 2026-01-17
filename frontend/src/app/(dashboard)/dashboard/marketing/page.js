'use client'
import { useEffect, useState } from 'react'
import { Target, FileText, TrendingUp, UserPlus } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import DataTable from '@/components/common/DataTable'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function MarketingDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    salesTarget: 0,
    activeQuotations: 0,
    conversionRate: 0,
    newCustomers: 0,
  })
  const [pendingQuotations, setPendingQuotations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/marketing')
      if (response.data.success) {
        setStats(response.data.data.stats || stats)
        setPendingQuotations(response.data.data.pendingQuotations || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quotationColumns = [
    { id: 'quote_number', header: 'Quote #', accessor: 'quote_number' },
    { id: 'customer', header: 'Customer', accessor: 'customer_name' },
    { id: 'total', header: 'Total', accessor: 'total_amount', cell: (row) => formatCurrency(row.total_amount) },
    { id: 'date', header: 'Date', accessor: 'created_at', cell: (row) => formatDate(row.created_at) },
    { 
      id: 'actions', 
      header: 'Actions', 
      cell: (row) => (
        <Button size="sm" onClick={() => router.push(`/quotations/${row.id}`)}>
          Convert to Order
        </Button>
      )
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Marketing Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Sales Target Achievement"
          value="85%"
          icon={Target}
          color="blue"
          trend="up"
          trendValue="+5%"
        />
        <StatCard
          title="Active Quotations"
          value={stats.activeQuotations}
          icon={FileText}
          color="yellow"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          color="green"
          trend="up"
          trendValue="+3.2%"
        />
        <StatCard
          title="New Customers"
          value={stats.newCustomers}
          icon={UserPlus}
          color="blue"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={quotationColumns}
            data={pendingQuotations}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}