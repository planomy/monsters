import type { AppState } from '../types'
import { FLOAT_SYNC_SOURCE } from './classroomSync'

/** Prevent a stale PiP snapshot from shrinking the roster after reward all / tally. */
export function mergeFloatSyncState(prev: AppState, incoming: AppState): AppState {
  if (incoming.classSize >= prev.classSize) return incoming

  return {
    ...incoming,
    classSize: prev.classSize,
    students: prev.students.map((student) => {
      const updated = incoming.students.find((entry) => entry.id === student.id)
      if (!updated) return student
      return updated.tally > student.tally ? { ...student, tally: updated.tally } : student
    }),
  }
}

export function shouldMergeFloatSync(sourceId: string, prev: AppState, incoming: AppState): boolean {
  return sourceId === FLOAT_SYNC_SOURCE && incoming.classSize < prev.classSize
}
