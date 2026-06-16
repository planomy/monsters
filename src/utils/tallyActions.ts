import type { AppState } from '../types'
import { isAssignedStudent } from '../data/defaults'
import { notifyClassroomSync, type ClassroomStateMessage } from './classroomSync'
import { loadStateForContext } from './floatBridge'
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
  studentId: string,
  sourceId: string,
  state?: AppState,
): AppState | null {
  const base = state ?? loadStateForContext()
  const next = applyIncrementTally(base, studentId)
  if (!next) return null

  const saved = saveState(next)
  const message: ClassroomStateMessage = {
    type: 'state',
    sourceId,
    state: saved,
    highlightStudentId: studentId,
  }
  notifyClassroomSync(message)
  return saved
}

export function applyRewardAll(state: AppState): AppState | null {
  const targets = state.students
    .slice(0, state.classSize)
    .map((student, index) => ({ student, index }))
    .filter(({ student, index }) => isAssignedStudent(student, index))

  if (targets.length === 0) return null

  const targetIds = new Set(targets.map(({ student }) => student.id))
  return {
    ...state,
    students: state.students.map((s) =>
      targetIds.has(s.id) ? { ...s, tally: s.tally + 1 } : s,
    ),
  }
}

export function commitRewardAll(sourceId: string, state?: AppState): AppState | null {
  const base = state ?? loadStateForContext()
  const next = applyRewardAll(base)
  if (!next) return null

  const saved = saveState(next)
  notifyClassroomSync({ type: 'state', sourceId, state: saved })
  return saved
}
