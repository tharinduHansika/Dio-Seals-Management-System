'use client'
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

export default function SearchBar({ onSearch, placeholder = 'Search...' }) {
  const [value, setValue] = useState('')
  const debouncedValue = useDebounce(value, 500)

  useState(() => {
    onSearch(debouncedValue)
  }, [debouncedValue, onSearch])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 pr-10"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  )
}