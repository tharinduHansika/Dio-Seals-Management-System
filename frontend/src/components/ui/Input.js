import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  className,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'input-field',
            Icon && 'pl-10',
            RightIcon && 'pr-10',
            error && 'border-error focus:ring-error',
            className
          )}
          {...props}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <RightIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input