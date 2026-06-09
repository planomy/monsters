export interface Student {
  id: string
  name: string
  tally: number
  monsterIndex: number
  absent: boolean
}

export interface AppState {
  students: Student[]
  className: string
  lastSaved: string | null
}

export interface HistorySnapshot {
  studentId: string
  previousTally: number
}

export type HistoryEntry =
  | { type: 'single'; studentId: string; previousTally: number; timestamp: string }
  | { type: 'batch'; students: HistorySnapshot[]; timestamp: string }
