import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { chartColor } from '../data/chartColors'
import type { PollOption, Student } from '../types'

export interface GreetAnchor {
  x: number
  y: number
  rect: DOMRect
}

interface AnswerPickerModalProps {
  student: Student
  options: PollOption[]
  currentOptionId: string | null
  anchor: GreetAnchor
  onSelect: (optionId: string) => void
  onClose: () => void
}

function placePopover(anchor: GreetAnchor, width: number, height: number) {
  const pad = 8
  let left = anchor.x + pad

  if (left + width > window.innerWidth - pad) {
    left = anchor.x - width - pad
  }
  if (left < pad) left = pad
  if (left + width > window.innerWidth - pad) {
    left = window.innerWidth - width - pad
  }

  const centeredTop = anchor.y - height / 2
  const centeredBottom = anchor.y + height / 2

  if (centeredTop >= pad && centeredBottom <= window.innerHeight - pad) {
    return { left, top: anchor.y, transform: 'translateY(-50%)' }
  }
  if (centeredTop < pad) {
    return { left, top: pad, transform: undefined }
  }
  return { left, top: window.innerHeight - height - pad, transform: undefined }
}

export function AnswerPickerModal({
  student,
  options,
  currentOptionId,
  anchor,
  onSelect,
  onClose,
}: AnswerPickerModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const firstOptionRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState(() => ({
    left: anchor.x + 8,
    top: anchor.y,
    transform: 'translateY(-50%)' as string | undefined,
  }))

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const { width, height } = panel.getBoundingClientRect()
    setPosition(placePopover(anchor, width, height))
  }, [anchor, options.length, student.id])

  useEffect(() => {
    firstOptionRef.current?.focus()
  }, [student.id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <>
      <button
        type="button"
        className="answer-popover__backdrop"
        aria-label="Close answer picker"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="answer-popover"
        style={{
          left: position.left,
          top: position.top,
          transform: position.transform,
        }}
        role="dialog"
        aria-label={`Record answer for ${student.name}`}
      >
        <div className="answer-popover__header">
          <span className="answer-popover__name">{student.name}</span>
          <button type="button" className="answer-popover__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="answer-popover__options" role="group" aria-label="Answer options">
          {options.map((option, index) => (
            <button
              key={option.id}
              ref={index === 0 ? firstOptionRef : undefined}
              type="button"
              className={
                currentOptionId === option.id
                  ? 'answer-popover__option answer-popover__option--selected'
                  : 'answer-popover__option'
              }
              style={{ '--option-color': chartColor(index) } as CSSProperties}
              onClick={() => {
                onSelect(option.id)
                onClose()
              }}
            >
              <span className="answer-popover__option-swatch" aria-hidden="true" />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  )
}
