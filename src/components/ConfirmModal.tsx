import { useEffect, useRef } from 'react'

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog ref={dialogRef} className="tool-modal" onClose={onCancel}>
      <div className="tool-modal__panel">
        <button type="button" className="tool-modal__close" onClick={onCancel} aria-label="Close">
          ×
        </button>
        <h2 className="tool-modal__title">{title}</h2>
        <p className="tool-modal__meta">{message}</p>
        <div className="tool-modal__actions">
          <button
            type="button"
            className="tool-modal__btn tool-modal__btn--primary tool-modal__btn--danger"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" className="tool-modal__btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  )
}
