import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
          type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
        }`}>
          <AlertTriangle className={`w-6 h-6 ${type === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  )
}