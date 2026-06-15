import type { Student } from '../types'

export const DEFAULT_CLASS_SIZE = 30
export const MIN_CLASS_SIZE = 1
export const MAX_CLASS_SIZE = 40

export function defaultStudentName(index: number): string {
  return `Student ${index + 1}`
}

export function isAssignedStudent(student: Student, index: number): boolean {
  return student.name.trim() !== defaultStudentName(index)
}

export function createStudentForSlot(index: number): Student {
  return {
    id: `student-${index + 1}`,
    name: defaultStudentName(index),
    tally: 0,
    monsterIndex: (index % 30) + 1,
    absent: false,
  }
}

export function createDefaultStudents(count = DEFAULT_CLASS_SIZE): Student[] {
  return Array.from({ length: count }, (_, index) => createStudentForSlot(index))
}

export function wouldLoseStudentData(students: Student[], newCount: number): boolean {
  if (newCount >= students.length) return false
    return students.slice(newCount).some((student, offset) => {
      const index = newCount + offset
      return student.tally > 0 || isAssignedStudent(student, index)
    })
}
