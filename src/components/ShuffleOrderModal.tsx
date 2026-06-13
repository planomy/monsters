import { useEffect, useRef } from 'react'
import type { Student } from '../types'

interface ShuffleOrderModalProps {
  students: Student[]
  onReshuffle: () => void
  onCopy: () => void
  onClose: () => void
}

export function ShuffleOrderModal({
  students,
  onReshuffle,
  onCopy,
  onClose,
}: ShuffleOrderModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <dialog ref={dialogRef} className="tool-modal" onClose={onClose}>
      <div className="tool-modal__panel tool-modal__panel--shuffle">
        <button type="button" className="tool-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className="tool-modal__title">Class order</h2>
        <p className="tool-modal__meta">
          {students.length
            ? `Random order for ${students.length} logged-on student${students.length === 1 ? '' : 's'}`
            : 'No logged-on students to shuffle'}
        </p>

        {students.length > 0 && (
          <ol className="shuffle-list">
            {students.map((student, index) => (
              <li key={student.id} className="shuffle-list__item">
                <span className="shuffle-list__num">{index + 1}</span>
                <span className="shuffle-list__name">{student.name}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="tool-modal__actions">
          <button
            type="button"
            className="tool-modal__btn tool-modal__btn--primary"
            onClick={onReshuffle}
            disabled={!students.length}
          >
            Shuffle again
          </button>
          <button
            type="button"
            className="tool-modal__btn"
            onClick={onCopy}
            disabled={!students.length}
          >
            Copy list
          </button>
        </div>
      </div>
    </dialog>
  )
}
