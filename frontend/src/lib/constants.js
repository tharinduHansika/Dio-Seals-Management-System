export const ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  MARKETING: 'marketing',
  STOREKEEPER: 'storekeeper',
  PRINTER: 'printer',
  CASHIER: 'cashier',
  ACCOUNTANT: 'accountant',
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PRODUCTION: 'in_production',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

export const PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
}

export const QUOTATION_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
}

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'card', label: 'Card' },
]

export const EXPENSE_CATEGORIES = [
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'rent', label: 'Rent' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
]