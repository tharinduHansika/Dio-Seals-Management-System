'use client'
import { useEffect, useState } from 'react'
import { Users, UserCheck, Activity, AlertCircle } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import DataTable from '@/components/common/DataTable'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/formatters'

export default function AdminDashboard() {

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    failedLogins: 0,
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/admin')
      if (response.data.success) {
        setStats(response.data.data.stats || stats)
        setRecentActivities(response.data.data.recentActivities || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activityColumns = [
    { id: 'user', header: 'User', accessor: 'username' },
    { id: 'action', header: 'Action', accessor: 'action' },
    { id: 'timestamp', header: 'Timestamp', accessor: 'created_at', cell: (row) => formatDateTime(row.created_at) },
    { id: 'ip', header: 'IP Address', accessor: 'ip_address' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="System Health"
          value="Healthy"
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Failed Logins (24h)"
          value={stats.failedLogins}
          icon={AlertCircle}
          color="red"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent User Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={activityColumns}
            data={recentActivities}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}