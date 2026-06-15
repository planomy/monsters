import {
  DEFAULT_CLASS_SIZE,
  ensureStudentSlots,
  MAX_CLASS_SIZE,
  MIN_CLASS_SIZE,
} from '../data/defaults'
import type { AppState, Student } from '../types'

export function normalizeStudent(student: Student): Student {
  return { ...student, absent: student.absent ?? false }
}

export function normalizeState(state: AppState): AppState {
  const classSize = Math.min(
    MAX_CLASS_SIZE,
    Math.max(MIN_CLASS_SIZE, state.classSize ?? state.students.length ?? DEFAULT_CLASS_SIZE),
  )
  const students = ensureStudentSlots(
    state.students.map(normalizeStudent),
    MAX_CLASS_SIZE,
  )

  return {
    ...state,
    classSize: Math.min(classSize, students.length),
    students,
  }
}
