import type { Student } from '../types'
import { StudentCard } from './StudentCard'

interface FloatStudentGridProps {
  students: Student[]
  highlightedStudentId?: string | null
  onIncrement: (id: string) => void
}

export function FloatStudentGrid({
  students,
  highlightedStudentId,
  onIncrement,
}: FloatStudentGridProps) {
  return (
    <section className="student-grid student-grid--float" aria-label="Float student cards">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          highlighted={student.id === highlightedStudentId}
          floatMode
          onIncrement={onIncrement}
          onDecrement={() => {}}
          onRename={() => {}}
        />
      ))}
    </section>
  )
}
