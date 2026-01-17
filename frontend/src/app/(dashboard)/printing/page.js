'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, Clock, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import StatusBadge from '@/components/common/StatusBadge'
import Badge from '@/components/ui/Badge'
import api from '@/lib/api'
import { formatDate } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function PrintingPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState({
    pending: [],
    in_progress: [],
    completed: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await api.get('/printing')
      if (response.data.success) {
        const allJobs = response.data.data
        setJobs({
          pending: allJobs.filter(j => j.status === 'pending'),
          in_progress: allJobs.filter(j => j.status === 'in_progress'),
          completed: allJobs.filter(j => j.status === 'completed' && 
            new Date(j.updated_at).toDateString() === new Date().toDateString()),
        })
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartJob = async (jobId) => {
    try {
      await api.patch(`/printing/${jobId}/status`, { status: 'in_progress' })
      toast.success('Job started')
      fetchJobs()
    } catch (error) {
      toast.error('Failed to start job')
    }
  }

  const handleCompleteJob = async (jobId) => {
    router.push(`/printing/${jobId}`)
  }

  const JobCard = ({ job, status }) => (
    <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/printing/${job.id}`)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-lg">{job.job_number}</p>
          <p className="text-sm text-gray-600">Order: {job.order_number}</p>
        </div>
        <Badge variant={
          job.priority === 'urgent' ? 'error' : 
          job.priority === 'high' ? 'warning' : 
          'default'
        }>
          {job.priority?.toUpperCase()}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Customer:</span>
          <span className="font-medium">{job.customer_name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-medium">{job.quantity}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Deadline:</span>
          <span className="font-medium">{formatDate(job.deadline)}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
        {status === 'pending' && (
          <Button size="sm" className="w-full" onClick={() => handleStartJob(job.id)}>
            Start Job
          </Button>
        )}
        {status === 'in_progress' && (
          <Button size="sm" className="w-full" variant="secondary" onClick={() => handleCompleteJob(job.id)}>
            Complete Job
          </Button>
        )}
        {status === 'completed' && (
          <div className="flex items-center justify-center text-green-600 text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Printing Operations</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="bg-yellow-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-yellow-600" />
                Pending ({jobs.pending.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {jobs.pending.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending jobs</p>
              ) : (
                jobs.pending.map(job => <JobCard key={job.id} job={job} status="pending" />)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                In Progress ({jobs.in_progress.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {jobs.in_progress.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No jobs in progress</p>
              ) : (
                jobs.in_progress.map(job => <JobCard key={job.id} job={job} status="in_progress" />)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-green-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Completed Today ({jobs.completed.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {jobs.completed.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No completed jobs today</p>
              ) : (
                jobs.completed.map(job => <JobCard key={job.id} job={job} status="completed" />)
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}