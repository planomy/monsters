import { useEffect, useRef } from 'react'
import type { Student } from '../types'
import { MonsterAvatar } from './MonsterAvatar'

interface PickStudentModalProps {
  student: Student | null
  remaining: number
  cycleSize: number
  onPickAgain: () => void
  onResetCycle: () => void
  onClose: () => void
}

export function PickStudentModal({
  student,
  remaining,
  cycleSize,
  onPickAgain,
  onResetCycle,
  onClose,
}: PickStudentModalProps) {
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

  const cycleNote =
    cycleSize > 0
      ? remaining > 0
        ? `${remaining} left before everyone is picked again`
        : 'Everyone picked — next pick starts a new round'
      : 'Mark students present to pick from the class'

  return (
    <dialog ref={dialogRef} className="tool-modal" onClose={onClose}>
      <div className="tool-modal__panel tool-modal__panel--pick">
        <button type="button" className="tool-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {student ? (
          <>
            <p className="tool-modal__eyebrow">Random pick</p>
            <div className="tool-modal__hero">
              <MonsterAvatar index={student.monsterIndex} name={student.name} />
            </div>
            <h2 className="tool-modal__name">{student.name}</h2>
            <p className="tool-modal__meta">{cycleNote}</p>
          </>
        ) : (
          <>
            <h2 className="tool-modal__name">No students to pick</h2>
            <p className="tool-modal__meta">
              Everyone is marked away. Tap <strong>Back</strong> on a card to mark them present.
            </p>
          </>
        )}

        <div className="tool-modal__actions">
          <button
            type="button"
            className="tool-modal__btn tool-modal__btn--primary"
            onClick={onPickAgain}
            disabled={!cycleSize}
          >
            Pick again
          </button>
          <button
            type="button"
            className="tool-modal__btn"
            onClick={onResetCycle}
            disabled={!cycleSize}
          >
            Reset round
          </button>
        </div>
      </div>
    </dialog>
  )
}
