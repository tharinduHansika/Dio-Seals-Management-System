'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import DataTable from '@/components/common/DataTable'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatCard from '@/components/common/StatCard'
import StatusBadge from '@/components/common/StatusBadge'
import { ShoppingCart, DollarSign, Receipt } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function CustomerDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    outstandingPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchCustomer()
    fetchCustomerStats()
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await api.get(`/customers/${params.id}`)
      if (response.data.success) {
        setCustomer(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerStats = async () => {
    try {
      const response = await api.get(`/customers/${params.id}/stats`)
      if (response.data.success) {
        setStats(response.data.data.stats || stats)
        setOrders(response.data.data.orders || [])
        setInvoices(response.data.data.invoices || [])
        setPayments(response.data.data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/customers/${params.id}`)
      toast.success('Customer deleted successfully')
      router.push('/customers')
    } catch (error) {
      toast.error('Failed to delete customer')
    }
  }

  const orderColumns = [
    { id: 'order_number', header: 'Order #', accessor: 'order_number' },
    { id: 'date', header: 'Date', accessor: 'order_date', cell: (row) => formatDate(row.order_date) },
    { id: 'total', header: 'Total', accessor: 'total_amount', cell: (row) => formatCurrency(row.total_amount) },
    { id: 'status', header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  const invoiceColumns = [
    { id: 'invoice_number', header: 'Invoice #', accessor: 'invoice_number' },
    { id: 'date', header: 'Date', accessor: 'invoice_date', cell: (row) => formatDate(row.invoice_date) },
    { id: 'amount', header: 'Amount', accessor: 'total_amount', cell: (row) => formatCurrency(row.total_amount) },
    { id: 'paid', header: 'Paid', accessor: 'paid_amount', cell: (row) => formatCurrency(row.paid_amount) },
    { id: 'status', header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  const paymentColumns = [
    { id: 'date', header: 'Date', accessor: 'payment_date', cell: (row) => formatDate(row.payment_date) },
    { id: 'invoice', header: 'Invoice #', accessor: 'invoice_number' },
    { id: 'amount', header: 'Amount', accessor: 'amount', cell: (row) => formatCurrency(row.amount) },
    { id: 'method', header: 'Method', accessor: 'payment_method', cell: (row) => (
      <span className="capitalize">{row.payment_method}</span>
    )},
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Customers', href: '/customers' },
          { label: customer.name },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-gray-600 mt-1">{customer.contact_person}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/customers/${params.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstandingPayments)}
          icon={Receipt}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                      {customer.country && `, ${customer.country}`}
                    </p>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">Customer Since</p>
                <p className="font-medium">{formatDate(customer.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="orders">
            {({ activeTab, setActiveTab }) => (
              <>
                <Card>
                  <CardHeader>
                    <TabsList>
                      <TabsTrigger value="orders" activeTab={activeTab} setActiveTab={setActiveTab}>
                        Orders
                      </TabsTrigger>
                      <TabsTrigger value="invoices" activeTab={activeTab} setActiveTab={setActiveTab}>
                        Invoices
                      </TabsTrigger>
                      <TabsTrigger value="payments" activeTab={activeTab} setActiveTab={setActiveTab}>
                        Payments
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent>
                    <TabsContent value="orders" activeTab={activeTab}>
                      <DataTable
                        columns={orderColumns}
                        data={orders}
                        onRowClick={(row) => router.push(`/orders/${row.id}`)}
                      />
                    </TabsContent>
                    <TabsContent value="invoices" activeTab={activeTab}>
                      <DataTable
                        columns={invoiceColumns}
                        data={invoices}
                        onRowClick={(row) => router.push(`/invoices/${row.id}`)}
                      />
                    </TabsContent>
                    <TabsContent value="payments" activeTab={activeTab}>
                      <DataTable
                        columns={paymentColumns}
                        data={payments}
                        onRowClick={(row) => router.push(`/payments/${row.id}`)}
                      />
                    </TabsContent>
                  </CardContent>
                </Card>
              </>
            )}
          </Tabs>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer.name}"? This action cannot be undone and will affect all related orders and invoices.`}
      />
    </div>
  )
}