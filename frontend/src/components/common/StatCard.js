import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={cn('text-sm', trend === 'up' ? 'text-green-600' : 'text-red-600')}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}