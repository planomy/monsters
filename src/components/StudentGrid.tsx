import type { Student } from '../types'
import { StudentCard } from './StudentCard'

interface StudentGridProps {
  students: Student[]
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRename: (id: string, name: string) => void
}

export function StudentGrid({ students, onIncrement, onDecrement, onRename }: StudentGridProps) {
  return (
    <section className="student-grid" aria-label="Student monster cards">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onRename={onRename}
        />
      ))}
    </section>
  )
}
