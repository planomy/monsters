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
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRename: (id: string, name: string) => void
  onToggleAbsent: (id: string) => void
}

export function StudentCard({
  student,
  highlighted = false,
  onIncrement,
  onDecrement,
  onRename,
  onToggleAbsent,
}: StudentCardProps) {
  const [editing, setEditing] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationVariant | null>(null)
  const [draftName, setDraftName] = useState(student.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevTallyRef = useRef(student.tally)

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
    student.absent && 'student-card--absent',
    highlighted && 'student-card--highlighted',
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
        e.preventDefault()
        onDecrement(student.id)
      }}
      title="Click to +1 · Shift+click or right-click to −1 · Double-click name to edit · Away toggles absence"
    >
      <button
        type="button"
        className={
          student.absent
            ? 'student-card__absent student-card__absent--on'
            : 'student-card__absent'
        }
        onClick={(e) => {
          e.stopPropagation()
          onToggleAbsent(student.id)
        }}
        aria-pressed={student.absent}
        aria-label={student.absent ? `Mark ${student.name} present` : `Mark ${student.name} away`}
      >
        {student.absent ? 'Back' : 'Away'}
      </button>

      <div className="student-card__tally" aria-label={`${student.tally} points`}>
        {student.tally}
      </div>

      <div className="student-card__monster">
        <MonsterAvatar index={student.monsterIndex} name={student.name} />
        {sparkles && (
          <span className={`student-card__sparkles student-card__sparkles--${celebration}`} aria-hidden="true">
            {sparkles.map((symbol, index) => (
              <span key={`${celebration}-${index}`}>{symbol}</span>
            ))}
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
              if (e.key === 'Escape') setEditing(false)
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Edit student name"
          />
        ) : (
          <h2 className="student-card__name" onDoubleClick={startEditing}>
            {student.name}
          </h2>
        )}
      </div>
    </article>
  )
}
