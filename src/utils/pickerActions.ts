import { getVisibleStudents } from '../data/defaults'
import type { AppState, Student } from '../types'
import { notifyClassroomSync, type ClassroomSyncMessage } from './classroomSync'
import { loadPickerPool, savePickerPool } from './pickerPool'
import { loadState } from './storage'
import { shuffle } from './random'

function presentStudents(students: Student[]) {
  return students.filter((s) => s.tally > 0)
}

export interface PickResult {
  student: Student | null
  remaining: number
  cycleSize: number
}

export function pickRandomStudentFromState(state: AppState): PickResult {
  const present = presentStudents(getVisibleStudents(state))
  const cycleSize = present.length
  if (!cycleSize) {
    return { student: null, remaining: 0, cycleSize: 0 }
  }

  const presentIds = new Set(present.map((s) => s.id))
  let pool = loadPickerPool().filter((id) => presentIds.has(id))
  if (!pool.length) {
    pool = shuffle(present.map((s) => s.id))
  }

  const pickedId = pool[0]
  pool = pool.slice(1)
  savePickerPool(pool)

  const student = state.students.find((s) => s.id === pickedId) ?? null
  return { student, remaining: pool.length, cycleSize }
}

export function commitPickStudent(
  sourceId: string,
  state?: AppState,
): { state: AppState; result: PickResult } {
  const base = state ?? loadState()
  const result = pickRandomStudentFromState(base)
  const message: ClassroomSyncMessage = {
    type: 'state',
    sourceId,
    state: base,
    highlightStudentId: result.student?.id,
  }
  notifyClassroomSync(message)
  return { state: base, result }
}
