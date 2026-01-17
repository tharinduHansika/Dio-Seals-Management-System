import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  
  const visiblePages = pages.filter(page => {
    if (page === 1 || page === totalPages) return true
    if (page >= currentPage - 1 && page <= currentPage + 1) return true
    return false
  })

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {visiblePages.map((page, index) => (
          <div key={page}>
            {index > 0 && visiblePages[index - 1] !== page - 1 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <Button
              variant={page === currentPage ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}