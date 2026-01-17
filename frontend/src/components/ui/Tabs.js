'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function Tabs({ defaultValue, children, className, onValueChange }) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  const handleTabChange = (value) => {
    setActiveTab(value)
    onValueChange?.(value)
  }

  return (
    <div className={cn('w-full', className)}>
      {children({ activeTab, setActiveTab: handleTabChange })}
    </div>
  )
}

export function TabsList({ children, className }) {
  return (
    <div className={cn('flex border-b border-gray-200', className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, activeTab, setActiveTab, className }) {
  const isActive = activeTab === value

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors border-b-2',
        isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, activeTab, className }) {
  if (activeTab !== value) return null

  return (
    <div className={cn('mt-4', className)}>
      {children}
    </div>
  )
}