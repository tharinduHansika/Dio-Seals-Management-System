'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Breadcrumb from '@/components/layout/Breadcrumb'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import api from '@/lib/api'
import { formatDate } from '@/lib/formatters'

const completeJobSchema = z.object({
  actual_quantity: z.string().min(1, 'Actual quantity is required'),
  defects: z.string().optional(),
  notes: z.string().optional(),
})

export default function PrintJobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(completeJobSchema),
  })

  useEffect(() => {
    fetchJob()
  }, [params.id])

  const fetchJob = async () => {
    try {
      const response = await api.get(`/printing/${params.id}`)
      if (response.data.success) {
        setJob(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      toast.error('Failed to load print job')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      const response = await api.post(`/printing/${params.id}/complete`, {
        actual_quantity: parseInt(data.actual_quantity),
        defects: parseInt(data.defects) || 0,
        notes: data.notes,
      })
      if (response.data.success) {
        toast.success('Print job completed successfully')
        router.push('/printing')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete job')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Print job not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Printing', href: '/printing' },
          { label: job.job_number },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{job.job_number}</h1>
          <p className="text-gray-600 mt-1">Order: {job.order_number}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Job Number</p>
                  <p className="font-medium">{job.job_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-medium">{job.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{job.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="font-medium">{job.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity Required</p>
                  <p className="font-medium text-lg">{job.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-medium">{formatDate(job.deadline)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="font-medium capitalize">{job.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={job.status} />
                </div>
                {job.serial_range_start && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Serial Number Range</p>
                    <p className="font-medium">{job.serial_range_start} - {job.serial_range_end}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {job.status === 'in_progress' && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Job</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Actual Quantity Produced *"
                    type="number"
                    {...register('actual_quantity')}
                    error={errors.actual_quantity?.message}
                    placeholder="Enter actual quantity"
                  />
                  <Input
                    label="Defects/Wastage"
                    type="number"
                    {...register('defects')}
                    placeholder="Enter number of defects"
                  />
                  <Textarea
                    label="Notes"
                    {...register('notes')}
                    placeholder="Any additional notes or observations..."
                    rows={3}
                  />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={() => router.back()}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={isSubmitting}>
                      Complete Job
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {job.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Completion Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Actual Quantity</p>
                    <p className="text-xl font-bold">{job.actual_quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Defects</p>
                    <p className="text-lg font-medium text-red-600">{job.defects || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quality Rate</p>
                    <p className="text-lg font-medium text-green-600">
                      {((job.actual_quantity - (job.defects || 0)) / job.actual_quantity * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed At</p>
                    <p className="font-medium">{formatDate(job.completed_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {job.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{job.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}