import type { AppState, Student } from '../types'

export function normalizeStudent(student: Student): Student {
  return { ...student, absent: student.absent ?? false }
}

export function normalizeState(state: AppState): AppState {
  return {
    ...state,
    students: state.students.map(normalizeStudent),
  }
}
