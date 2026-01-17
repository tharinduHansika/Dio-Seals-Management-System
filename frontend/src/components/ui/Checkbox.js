import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Checkbox = forwardRef(({ label, className, ...props }, ref) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2',
          className
        )}
        {...props}
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox