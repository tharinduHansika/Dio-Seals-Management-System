import { FileQuestion } from 'lucide-react'

export default function EmptyState({ icon: Icon = FileQuestion, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-16 h-16 text-gray-300 mb-4" />
      <p className="text-gray-500 text-lg mb-4">{message}</p>
      {action}
    </div>
  )
}