import Badge from '@/components/ui/Badge'

const statusVariants = {
  pending: 'warning',
  confirmed: 'info',
  in_production: 'info',
  ready: 'success',
  delivered: 'success',
  cancelled: 'error',
  paid: 'success',
  unpaid: 'error',
  partial: 'warning',
  overdue: 'error',
  draft: 'default',
  sent: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'default',
  active: 'success',
  inactive: 'default',
}

export default function StatusBadge({ status }) {
  const variant = statusVariants[status] || 'default'
  const label = status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'

  return <Badge variant={variant}>{label}</Badge>
}