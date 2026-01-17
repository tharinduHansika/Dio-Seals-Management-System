'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Breadcrumb from '@/components/layout/Breadcrumb'
import StatusBadge from '@/components/common/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${params.id}`)
      if (response.data.success) {
        setProduct(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${params.id}`)
      toast.success('Product deleted successfully')
      router.push('/products')
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Product not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Products', href: '/products' },
          { label: product.name },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/products/${params.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Product Name</p>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SKU</p>
                  <p className="font-medium">{product.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={product.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unit Price</p>
                  <p className="font-medium text-lg text-primary">{formatCurrency(product.unit_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="font-medium">{product.current_stock || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minimum Stock</p>
                  <p className="font-medium">{product.minimum_stock}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{formatDate(product.created_at)}</p>
                </div>
                {product.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-900">{product.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="text-2xl font-bold">{product.current_stock || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minimum Required</p>
                  <p className="text-xl font-medium">{product.minimum_stock}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock Status</p>
                  {(product.current_stock || 0) < product.minimum_stock ? (
                    <span className="text-red-600 font-medium">Low Stock</span>
                  ) : (
                    <span className="text-green-600 font-medium">OK</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  )
}