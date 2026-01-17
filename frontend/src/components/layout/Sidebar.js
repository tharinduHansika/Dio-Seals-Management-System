'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  DollarSign,
  TrendingDown,
  Archive,
  Box,
  Printer,
  BarChart3,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

// Define role constants to match backend
const ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  MARKETING: 'marketing',
  STOREKEEPER: 'storekeeper',
  PRINTER: 'printer',
  CASHIER: 'cashier',
  ACCOUNTANT: 'accountant',
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: Object.values(ROLES) },
  { icon: Users, label: 'Customers', href: '/customers', roles: [ROLES.DIRECTOR, ROLES.MARKETING] },
  { icon: Package, label: 'Products', href: '/products', roles: [ROLES.DIRECTOR, ROLES.MARKETING, ROLES.STOREKEEPER] },
  { icon: FileText, label: 'Quotations', href: '/quotations', roles: [ROLES.DIRECTOR, ROLES.MARKETING] },
  { icon: ShoppingCart, label: 'Orders', href: '/orders', roles: [ROLES.DIRECTOR, ROLES.MARKETING, ROLES.STOREKEEPER] },
  { icon: Receipt, label: 'Invoices', href: '/invoices', roles: [ROLES.DIRECTOR, ROLES.ACCOUNTANT, ROLES.CASHIER] },
  { icon: DollarSign, label: 'Payments', href: '/payments', roles: [ROLES.DIRECTOR, ROLES.ACCOUNTANT, ROLES.CASHIER] },
  { icon: TrendingDown, label: 'Expenses', href: '/expenses', roles: [ROLES.DIRECTOR, ROLES.ACCOUNTANT] },
  { icon: Archive, label: 'Assets', href: '/assets', roles: [ROLES.DIRECTOR, ROLES.ACCOUNTANT] },
  { icon: Box, label: 'Stock', href: '/stock', roles: [ROLES.DIRECTOR, ROLES.STOREKEEPER] },
  { icon: Printer, label: 'Printing', href: '/printing', roles: [ROLES.DIRECTOR, ROLES.PRINTER] },
  { icon: BarChart3, label: 'Reports', href: '/reports', roles: [ROLES.DIRECTOR, ROLES.ACCOUNTANT, ROLES.MARKETING] },
  { icon: Users, label: 'Users', href: '/users', roles: [ROLES.ADMIN] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  )

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-bold">Dio Seals</h1>
        <p className="text-sm text-gray-400 mt-1">Management System</p>
      </div>

      <nav className="px-3 py-4">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href === '/dashboard' ? `/dashboard/${user?.role}` : item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}