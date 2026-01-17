'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/constants'
import api from '@/lib/api'

const expenseSchema = z.object({
  expense_date: z.string().min(1, 'Expense date is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  payment_method: z.string().min(1, 'Payment method is required'),
  vendor: z.string().optional(),
  notes: z.string().optional(),
})

export default function EditExpensePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
  })

  useEffect(() => {
    fetchExpense()
  }, [params.id])

  const fetchExpense = async () => {
    try {
      const response = await api.get(`/expenses/${params.id}`)
      if (response.data.success) {
        const expense = response.data.data
        reset({
          expense_date: expense.expense_date.split('T')[0],
          category: expense.category,
          description: expense.description,
          amount: expense.amount.toString(),
          payment_method: expense.payment_method,
          vendor: expense.vendor || '',
          notes: expense.notes || '',
        })
      }
    } catch (error) {
      console.error('Error fetching expense:', error)
      toast.error('Failed to load expense')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      const response = await api.put(`/expenses/${params.id}`, {
        ...data,
        amount: parseFloat(data.amount),
      })
      if (response.data.success) {
        toast.success('Expense updated successfully')
        router.push('/expenses')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update expense')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Expenses', href: '/expenses' },
          { label: 'Edit Expense' },
        ]}
      />

      <h1 className="text-3xl font-bold">Edit Expense</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Expense Date *"
                type="date"
                {...register('expense_date')}
                error={errors.expense_date?.message}
              />
              <Select
                label="Category *"
                {...register('category')}
                error={errors.category?.message}
                options={EXPENSE_CATEGORIES}
              />
              <div className="md:col-span-2">
                <Input
                  label="Description *"
                  {...register('description')}
                  error={errors.description?.message}
                />
              </div>
              <Input
                label="Amount *"
                type="number"
                step="0.01"
                {...register('amount')}
                error={errors.amount?.message}
              />
              <Select
                label="Payment Method *"
                {...register('payment_method')}
                error={errors.payment_method?.message}
                options={PAYMENT_METHODS}
              />
              <div className="md:col-span-2">
                <Input
                  label="Vendor/Supplier"
                  {...register('vendor')}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  {...register('notes')}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Update Expense
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}