import { useCallback, useEffect, useRef, useState } from 'react'
import { createDefaultStudents } from '../data/defaults'
import type { AppState, HistoryEntry, Student } from '../types'
import { importFromJson } from '../utils/export'
import { shuffle } from '../utils/random'
import { activateEmbeddedStorage, loadState, saveState } from '../utils/storage'

function presentStudents(students: Student[]) {
  return students.filter((s) => !s.absent)
}

export function useMonsterz() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pickerPoolRef = useRef<string[]>([])

  const commitSave = useCallback((next: AppState) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    try {
      const saved = saveState(next)
      setState(saved)
      setSaveStatus('saved')
      return saved
    } catch {
      setState(next)
      setSaveStatus('idle')
      return next
    }
  }, [])

  const persist = useCallback(
    (next: AppState) => {
      setSaveStatus('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)

      saveTimer.current = setTimeout(() => {
        saveTimer.current = null
        commitSave(next)
      }, 400)
    },
    [commitSave],
  )

  const updateState = useCallback(
    (updater: (prev: AppState) => AppState) => {
      setState((prev) => {
        const next = updater(prev)
        persist(next)
        return next
      })
    },
    [persist],
  )

  const incrementTally = useCallback(
    (studentId: string) => {
      updateState((prev) => {
        const student = prev.students.find((s) => s.id === studentId)
        if (!student) return prev

        setHistory((h) => [
          ...h.slice(-19),
          {
            type: 'single',
            studentId,
            previousTally: student.tally,
            timestamp: new Date().toISOString(),
          },
        ])

        return {
          ...prev,
          students: prev.students.map((s) =>
            s.id === studentId ? { ...s, tally: s.tally + 1 } : s,
          ),
        }
      })
    },
    [updateState],
  )

  const decrementTally = useCallback(
    (studentId: string) => {
      updateState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId ? { ...s, tally: Math.max(0, s.tally - 1) } : s,
        ),
      }))
    },
    [updateState],
  )

  const undoLast = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const last = h[h.length - 1]

      updateState((prev) => {
        const snapshots =
          last.type === 'batch'
            ? last.students
            : [{ studentId: last.studentId, previousTally: last.previousTally }]

        const restore = new Map(snapshots.map((s) => [s.studentId, s.previousTally]))
        return {
          ...prev,
          students: prev.students.map((s) =>
            restore.has(s.id) ? { ...s, tally: restore.get(s.id)! } : s,
          ),
        }
      })

      return h.slice(0, -1)
    })
  }, [updateState])

  const rewardAll = useCallback(() => {
    updateState((prev) => {
      const timestamp = new Date().toISOString()
      setHistory((h) => [
        ...h.slice(-19),
        {
          type: 'batch',
          students: prev.students.map((s) => ({
            studentId: s.id,
            previousTally: s.tally,
          })),
          timestamp,
        },
      ])

      return {
        ...prev,
        students: prev.students.map((s) => ({ ...s, tally: s.tally + 1 })),
      }
    })
  }, [updateState])

  const updateName = useCallback(
    (studentId: string, name: string) => {
      updateState((prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.id === studentId ? { ...s, name } : s)),
      }))
    },
    [updateState],
  )

  const setClassName = useCallback(
    (className: string) => {
      updateState((prev) => ({ ...prev, className }))
    },
    [updateState],
  )

  const resetAllTallies = useCallback(() => {
    void activateEmbeddedStorage()
    let next!: AppState
    setState((prev) => {
      next = {
        ...prev,
        students: prev.students.map((s) => ({ ...s, tally: 0 })),
      }
      return next
    })
    commitSave(next)
    setHistory([])
  }, [commitSave])

  const resetToDefaults = useCallback(() => {
    const next: AppState = {
      className: 'My Class',
      students: createDefaultStudents(),
      lastSaved: null,
    }
    commitSave(next)
    setHistory([])
    pickerPoolRef.current = []
  }, [commitSave])

  const manualSave = useCallback(() => {
    commitSave(state)
  }, [commitSave, state])

  const importState = useCallback(
    async (file: File) => {
      const imported = await importFromJson(file)
      commitSave(imported)
      setHistory([])
      pickerPoolRef.current = []
    },
    [commitSave],
  )

  const toggleAbsent = useCallback(
    (studentId: string) => {
      updateState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId ? { ...s, absent: !s.absent } : s,
        ),
      }))
      pickerPoolRef.current = pickerPoolRef.current.filter((id) => id !== studentId)
    },
    [updateState],
  )

  const pickRandomStudent = useCallback((): {
    student: Student | null
    remaining: number
    cycleSize: number
  } => {
    const present = presentStudents(state.students)
    const cycleSize = present.length
    if (!cycleSize) {
      return { student: null, remaining: 0, cycleSize: 0 }
    }

    const presentIds = new Set(present.map((s) => s.id))
    let pool = pickerPoolRef.current.filter((id) => presentIds.has(id))
    if (!pool.length) {
      pool = shuffle(present.map((s) => s.id))
    }

    const pickedId = pool[0]
    pickerPoolRef.current = pool.slice(1)
    const student = state.students.find((s) => s.id === pickedId) ?? null
    return { student, remaining: pickerPoolRef.current.length, cycleSize }
  }, [state.students])

  const resetPickerCycle = useCallback(() => {
    pickerPoolRef.current = []
  }, [])

  const shuffleClassOrder = useCallback((): Student[] => {
    return shuffle(presentStudents(state.students))
  }, [state.students])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const totalTallies = state.students.reduce((sum, s) => sum + s.tally, 0)
  const presentCount = presentStudents(state.students).length
  const absentCount = state.students.length - presentCount

  return {
    state,
    saveStatus,
    history,
    totalTallies,
    presentCount,
    absentCount,
    incrementTally,
    decrementTally,
    rewardAll,
    undoLast,
    updateName,
    setClassName,
    resetAllTallies,
    resetToDefaults,
    manualSave,
    importState,
    toggleAbsent,
    pickRandomStudent,
    resetPickerCycle,
    shuffleClassOrder,
  }
}
