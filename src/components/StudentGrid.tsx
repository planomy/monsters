import type { Student } from '../types'
import { StudentCard } from './StudentCard'

interface StudentGridProps {
  students: Student[]
  highlightedStudentId?: string | null
  onIncrement?: (id: string) => void
  onDecrement?: (id: string) => void
  onRename: (id: string, name: string) => void
  pollMode?: boolean
  getPollAnswerLabel?: (id: string) => string | null
  onGreet?: (id: string, anchor: { x: number; y: number; rect: DOMRect }) => void
}

export function StudentGrid({
  students,
  highlightedStudentId,
  onIncrement,
  onDecrement,
  onRename,
  pollMode = false,
  getPollAnswerLabel,
  onGreet,
}: StudentGridProps) {
  return (
    <section
      className={pollMode ? 'student-grid student-grid--compact' : 'student-grid'}
      aria-label="Student monster cards"
    >
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          highlighted={student.id === highlightedStudentId}
          pollAnswerLabel={pollMode && getPollAnswerLabel ? getPollAnswerLabel(student.id) : null}
          onGreet={pollMode ? onGreet : undefined}
          onIncrement={onIncrement ?? (() => {})}
          onDecrement={onDecrement ?? (() => {})}
          onRename={onRename}
        />
      ))}
    </section>
  )
}
