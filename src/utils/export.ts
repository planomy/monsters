import type { AppState, Student } from '../types'
import { getVisibleStudents } from '../data/defaults'
import { normalizeState } from './normalize'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function timestampSlug() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
}

export function exportToJson(state: AppState) {
  const slug = state.className.replace(/\s+/g, '-').toLowerCase() || 'class'
  const students = getVisibleStudents(state)
  const payload = {
    exportedAt: new Date().toISOString(),
    className: state.className,
    classSize: state.classSize,
    students: students.map(({ id, name, tally, monsterIndex, absent }) => ({
      id,
      name,
      tally,
      monsterIndex,
      absent,
    })),
    totalTallies: students.reduce((sum, s) => sum + s.tally, 0),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `monsterz-${slug}-${timestampSlug()}.json`)
}

export function exportToCsv(state: AppState) {
  const slug = state.className.replace(/\s+/g, '-').toLowerCase() || 'class'
  const header = 'Name,Tally,Monster,Student ID'
  const rows = getVisibleStudents(state).map(
    (s) => `"${s.name.replace(/"/g, '""')}",${s.tally},${s.monsterIndex},${s.id}`,
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `monsterz-${slug}-${timestampSlug()}.csv`)
}

export async function importFromJson(file: File): Promise<AppState> {
  const text = await file.text()
  const parsed = JSON.parse(text) as {
    className?: string
    students?: Student[]
  }

  if (!parsed.students?.length) {
    throw new Error('Invalid file: no student data found.')
  }

  return normalizeState({
    className: parsed.className ?? 'My Class',
    students: parsed.students,
    classSize: parsed.students.length,
    lastSaved: new Date().toISOString(),
  })
}
