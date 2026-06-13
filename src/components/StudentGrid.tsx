import type { Student } from '../types'
import { StudentCard } from './StudentCard'

interface StudentGridProps {
  students: Student[]
  highlightedStudentId?: string | null
  onIncrement?: (id: string) => void
  onDecrement?: (id: string) => void
  onRename: (id: string, name: string) => void
  pollMode?: boolean
  getPollQ1AnswerLabel?: (id: string) => string | null
  getPollQ2AnswerLabel?: (id: string) => string | null
  onGreet?: (id: string, anchor: { x: number; y: number; rect: DOMRect }) => void
}

export function StudentGrid({
  students,
  highlightedStudentId,
  onIncrement,
  onDecrement,
  onRename,
  pollMode = false,
  getPollQ1AnswerLabel,
  getPollQ2AnswerLabel,
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
          pollQ1AnswerLabel={
            pollMode && getPollQ1AnswerLabel ? getPollQ1AnswerLabel(student.id) : null
          }
          pollQ2AnswerLabel={
            pollMode && getPollQ2AnswerLabel ? getPollQ2AnswerLabel(student.id) : null
          }
          onGreet={pollMode ? onGreet : undefined}
          onIncrement={onIncrement ?? (() => {})}
          onDecrement={onDecrement ?? (() => {})}
          onRename={onRename}
        />
      ))}
    </section>
  )
}
