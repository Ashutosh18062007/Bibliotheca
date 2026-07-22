import { useState } from 'react'
import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete' }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const handleConfirm = async () => {
    setLoading(true)
    try { await onConfirm() } finally { setLoading(false); onClose() }
  }
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-error-100 dark:bg-error-900/30 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} className="text-error-600" />
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300 pt-1">{message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleConfirm} disabled={loading} className="btn-danger">
          {loading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
