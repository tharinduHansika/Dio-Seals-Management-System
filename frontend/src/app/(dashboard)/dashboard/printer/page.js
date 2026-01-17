'use client'
import { useEffect, useState } from 'react'
import { Printer, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import DataTable from '@/components/common/DataTable'
import api from '@/lib/api'
import { formatDate } from '@/lib/formatters'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/common/StatusBadge'

export default function PrinterDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    pendingJobs: 0,
    inProgress: 0,
    completedToday: 0,
    defectRate: 0,
  })
  const [printQueue, setPrintQueue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/printer')
      if (response.data.success) {
        setStats(response.data.data.stats || stats)
        setPrintQueue(response.data.data.printQueue || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const queueColumns = [
    { id: 'job_number', header: 'Job #', accessor: 'job_number' },
    { id: 'order', header: 'Order #', accessor: 'order_number' },
    { id: 'quantity', header: 'Quantity', accessor: 'quantity' },
    { id: 'priority', header: 'Priority', cell: (row) => <StatusBadge status={row.priority} /> },
    { id: 'deadline', header: 'Deadline', accessor: 'deadline', cell: (row) => formatDate(row.deadline) },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button size="sm" onClick={() => handleStartJob(row.id)}>
          Start
        </Button>
      ),
    },
  ]

  const handleStartJob = async (jobId) => {
    try {
      await api.patch(`/printing/${jobId}/status`, { status: 'in_progress' })
      fetchDashboardData()
    } catch (error) {
      console.error('Error starting job:', error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Printer Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Jobs"
          value={stats.pendingJobs}
          icon={Printer}
          color="yellow"
        />
        <StatCard
          title="Jobs in Progress"
          value={stats.inProgress}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Defect Rate"
          value={`${stats.defectRate}%`}
          icon={AlertCircle}
          color="red"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Print Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={queueColumns}
            data={printQueue}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}