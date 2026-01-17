'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable from '@/components/common/DataTable'
import SearchBar from '@/components/common/SearchBar'
import Select from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import StatusBadge from '@/components/common/StatusBadge'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import api from '@/lib/api'
import { formatDate } from '@/lib/formatters'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deleteUser, setDeleteUser] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, searchQuery, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchQuery,
          role: roleFilter,
        },
      })
      if (response.data.success) {
        setUsers(response.data.data)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteUser.id}`)
      toast.success('User deleted successfully')
      setDeleteUser(null)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await api.patch(`/users/${userId}/status`, {
        status: currentStatus === 'active' ? 'inactive' : 'active',
      })
      toast.success('User status updated')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const columns = [
    { id: 'username', header: 'Username', accessor: 'username', sortable: true },
    { id: 'email', header: 'Email', accessor: 'email' },
    { id: 'role', header: 'Role', accessor: 'role', cell: (row) => (
      <span className="capitalize font-medium">{row.role}</span>
    )},
    { id: 'status', header: 'Status', accessor: 'status', cell: (row) => <StatusBadge status={row.status} /> },
    { id: 'created', header: 'Created', accessor: 'created_at', cell: (row) => formatDate(row.created_at) },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleStatusToggle(row.id, row.status)}
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteUser(row)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={() => router.push('/users/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select
                  options={[
                    { value: '', label: 'All Roles' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'director', label: 'Director' },
                    { value: 'marketing', label: 'Marketing' },
                    { value: 'storekeeper', label: 'Storekeeper' },
                    { value: 'printer', label: 'Printer' },
                    { value: 'cashier', label: 'Cashier' },
                    { value: 'accountant', label: 'Accountant' },
                  ]}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                />
              </div>
              <div className="w-80">
                <SearchBar
                  placeholder="Search users..."
                  onSearch={setSearchQuery}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteUser?.username}"? This action cannot be undone.`}
      />
    </div>
  )
}