import type { AppState } from '../types'
import { notifyClassroomSync, type ClassroomSyncMessage } from './classroomSync'
import { saveState } from './storage'

export function applyIncrementTally(state: AppState, studentId: string): AppState | null {
  const student = state.students.find((s) => s.id === studentId)
  if (!student) return null

  return {
    ...state,
    students: state.students.map((s) =>
      s.id === studentId ? { ...s, tally: s.tally + 1 } : s,
    ),
  }
}

export function commitIncrementTally(
  state: AppState,
  studentId: string,
  sourceId: string,
): AppState | null {
  const next = applyIncrementTally(state, studentId)
  if (!next) return null

  const saved = saveState(next)
  const message: ClassroomSyncMessage = {
    type: 'state',
    sourceId,
    state: saved,
    highlightStudentId: studentId,
  }
  notifyClassroomSync(message)
  return saved
}
