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

export type ChartType = 'bar' | 'pie'

export interface PollOption {
  id: string
  label: string
}

export interface PollQuestion {
  id: string
  question: string
  options: PollOption[]
  responses: Record<string, string>
}

export interface MorningPollState {
  questions: PollQuestion[]
  activeQuestionIndex: number
  chartType: ChartType
}
