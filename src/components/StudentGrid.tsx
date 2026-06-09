import type { Student } from '../types'
import { StudentCard } from './StudentCard'

interface StudentGridProps {
  students: Student[]
  highlightedStudentId?: string | null
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRename: (id: string, name: string) => void
  onToggleAbsent: (id: string) => void
}

export function StudentGrid({
  students,
  highlightedStudentId,
  onIncrement,
  onDecrement,
  onRename,
  onToggleAbsent,
}: StudentGridProps) {
  return (
    <section className="student-grid" aria-label="Student monster cards">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          highlighted={student.id === highlightedStudentId}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onRename={onRename}
          onToggleAbsent={onToggleAbsent}
        />
      ))}
    </section>
  )
}
