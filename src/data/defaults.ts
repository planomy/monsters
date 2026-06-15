import type { AppState, Student } from '../types'

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

export function ensureStudentSlots(students: Student[], minSlots: number): Student[] {
  if (students.length >= minSlots) return students
  return [
    ...students,
    ...Array.from({ length: minSlots - students.length }, (_, offset) =>
      createStudentForSlot(students.length + offset),
    ),
  ]
}

export function getVisibleStudents(state: AppState): Student[] {
  return state.students.slice(0, state.classSize)
}
