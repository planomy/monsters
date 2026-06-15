import { useEffect, useRef, useState } from 'react'

interface PromptModalProps {
  title: string
  message?: string
  label: string
  defaultValue?: string
  confirmLabel?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function PromptModal({
  title,
  message,
  label,
  defaultValue = '',
  confirmLabel = 'Save',
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const submit = () => {
    onConfirm(value.trim())
  }

  return (
    <dialog ref={dialogRef} className="tool-modal" onClose={onCancel}>
      <div className="tool-modal__panel">
        <button type="button" className="tool-modal__close" onClick={onCancel} aria-label="Close">
          ×
        </button>
        <h2 className="tool-modal__title">{title}</h2>
        {message && <p className="tool-modal__meta">{message}</p>}
        <label className="prompt-modal__label">
          {label}
          <input
            ref={inputRef}
            className="prompt-modal__input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
          />
        </label>
        <div className="tool-modal__actions">
          <button type="button" className="tool-modal__btn tool-modal__btn--primary" onClick={submit}>
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
