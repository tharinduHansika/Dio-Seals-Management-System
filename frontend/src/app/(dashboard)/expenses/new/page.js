'use client'
import { useRouter } from 'next/navigation'
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

export default function NewExpensePage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/expenses', {
        ...data,
        amount: parseFloat(data.amount),
      })
      if (response.data.success) {
        toast.success('Expense recorded successfully')
        router.push('/expenses')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record expense')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Expenses', href: '/expenses' },
          { label: 'Record Expense' },
        ]}
      />

      <h1 className="text-3xl font-bold">Record New Expense</h1>

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
                  placeholder="Brief description of the expense"
                />
              </div>
              <Input
                label="Amount *"
                type="number"
                step="0.01"
                {...register('amount')}
                error={errors.amount?.message}
                placeholder="0.00"
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
                  placeholder="Optional vendor name"
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  {...register('notes')}
                  placeholder="Additional notes or details..."
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
              Record Expense
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}