import { useEffect, useRef, useState } from 'react'
import {
  CELEBRATION_DURATION_MS,
  CELEBRATION_SPARKLES,
  type CelebrationVariant,
  pickCelebration,
} from '../data/celebrations'
import type { Student } from '../types'
import { MonsterAvatar } from './MonsterAvatar'

interface StudentCardProps {
  student: Student
  highlighted?: boolean
  pollAnswerLabel?: string | null
  onGreet?: (id: string, anchor: { x: number; y: number; rect: DOMRect }) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRename: (id: string, name: string) => void
}

export function StudentCard({
  student,
  highlighted = false,
  pollAnswerLabel = null,
  onGreet,
  onIncrement,
  onDecrement,
  onRename,
}: StudentCardProps) {
  const [editing, setEditing] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationVariant | null>(null)
  const [draftName, setDraftName] = useState(student.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevTallyRef = useRef(student.tally)
  const isLoggedOn = student.tally > 0

  useEffect(() => {
    if (student.tally > prevTallyRef.current) {
      setCelebration(pickCelebration())
      const timer = window.setTimeout(() => setCelebration(null), CELEBRATION_DURATION_MS)
      prevTallyRef.current = student.tally
      return () => window.clearTimeout(timer)
    }
    prevTallyRef.current = student.tally
  }, [student.tally])

  const handleClick = (e: React.MouseEvent) => {
    if (editing) return
    if (onGreet) {
      onGreet(student.id, {
        x: e.clientX,
        y: e.clientY,
        rect: e.currentTarget.getBoundingClientRect(),
      })
      return
    }
    if (e.shiftKey) {
      onDecrement(student.id)
    } else {
      onIncrement(student.id)
    }
  }

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraftName(student.name)
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const commitName = () => {
    const trimmed = draftName.trim()
    if (trimmed) onRename(student.id, trimmed)
    setEditing(false)
  }

  const cardClass = [
    'student-card',
    celebration && `student-card--celebrate student-card--${celebration}`,
    !isLoggedOn && 'student-card--away',
    highlighted && 'student-card--highlighted',
    pollAnswerLabel && 'student-card--answered',
  ]
    .filter(Boolean)
    .join(' ')

  const sparkles = celebration ? CELEBRATION_SPARKLES[celebration] : null

  return (
    <article
      id={`student-${student.id}`}
      className={cardClass}
      onClick={handleClick}
      onContextMenu={(e) => {
        if (onGreet) return
        e.preventDefault()
        onDecrement(student.id)
      }}
      title={
        onGreet
          ? 'Tap to greet and record answer · Double-click name to edit'
          : 'Click to +1 · Shift+click or right-click to −1 · Double-click name to edit'
      }
    >
      <span
        className="student-card__status"
        aria-label={isLoggedOn ? `${student.name} logged on` : `${student.name} not logged on`}
      >
        <span
          className={
            isLoggedOn
              ? 'student-card__status-dot student-card__status-dot--present'
              : 'student-card__status-dot student-card__status-dot--away'
          }
          aria-hidden="true"
        />
      </span>

      <div className="student-card__tally" aria-label={`${student.tally} points`}>
        {student.tally}
      </div>

      <div className="student-card__monster">
        <MonsterAvatar index={student.monsterIndex} name={student.name} />
        {sparkles && (
          <span className={`student-card__sparkles student-card__sparkles--${celebration}`} aria-hidden="true">
            {sparkles}
          </span>
        )}
      </div>

      <div className="student-card__info">
        {editing ? (
          <input
            ref={inputRef}
            className="student-card__name-input"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') {
                setDraftName(student.name)
                setEditing(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="student-card__name" onDoubleClick={startEditing}>
            {student.name}
          </h3>
        )}

        {onGreet && (
          <p
            className={
              pollAnswerLabel
                ? 'student-card__poll-answer'
                : 'student-card__poll-answer student-card__poll-answer--empty'
            }
            title={pollAnswerLabel ? 'Morning question answers' : undefined}
            aria-hidden={!pollAnswerLabel}
          >
            {pollAnswerLabel ?? '\u00A0'}
          </p>
        )}
      </div>
    </article>
  )
}
