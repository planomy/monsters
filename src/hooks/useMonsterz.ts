import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createDefaultStudents,
  DEFAULT_CLASS_SIZE,
  ensureStudentSlots,
  getVisibleStudents,
  isAssignedStudent,
  MAX_CLASS_SIZE,
  MIN_CLASS_SIZE,
} from '../data/defaults'
import type { AppState, HistoryEntry, Student } from '../types'
import { importFromJson } from '../utils/export'
import { shuffle } from '../utils/random'
import { MAIN_SYNC_SOURCE, notifyClassroomSync, subscribeClassroomSync } from '../utils/classroomSync'
import { activateEmbeddedStorage, APP_STATE_STORAGE_KEY, loadState, saveState } from '../utils/storage'
import { applyIncrementTally } from '../utils/tallyActions'
import { normalizeState } from '../utils/normalize'

function presentStudents(students: Student[]) {
  return students.filter((s) => s.tally > 0)
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
      notifyClassroomSync({ type: 'state', sourceId: MAIN_SYNC_SOURCE, state: saved })
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
        if (next !== prev) {
          persist(next)
          notifyClassroomSync({ type: 'state', sourceId: MAIN_SYNC_SOURCE, state: next })
        }
        return next
      })
    },
    [persist],
  )

  const incrementTally = useCallback(
    (studentId: string) => {
      updateState((prev) => {
        const student = prev.students.find((s) => s.id === studentId)
        const next = applyIncrementTally(prev, studentId)
        if (!next || !student) return prev

        setHistory((h) => [
          ...h.slice(-19),
          {
            type: 'single',
            studentId,
            previousTally: student.tally,
            timestamp: new Date().toISOString(),
          },
        ])

        return next
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
      const targets = prev.students
        .map((student, index) => ({ student, index }))
        .filter(({ index }) => index < prev.classSize)
        .filter(({ student, index }) => isAssignedStudent(student, index))

      if (targets.length === 0) return prev

      const timestamp = new Date().toISOString()
      setHistory((h) => [
        ...h.slice(-19),
        {
          type: 'batch',
          students: targets.map(({ student }) => ({
            studentId: student.id,
            previousTally: student.tally,
          })),
          timestamp,
        },
      ])

      const targetIds = new Set(targets.map(({ student }) => student.id))
      return {
        ...prev,
        students: prev.students.map((s) =>
          targetIds.has(s.id) ? { ...s, tally: s.tally + 1 } : s,
        ),
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
      const visibleIds = new Set(getVisibleStudents(prev).map((s) => s.id))
      next = {
        ...prev,
        students: prev.students.map((s) =>
          visibleIds.has(s.id) ? { ...s, tally: 0 } : s,
        ),
      }
      return next
    })
    commitSave(next)
    setHistory([])
  }, [commitSave])

  const resetToDefaults = useCallback(() => {
    const next: AppState = normalizeState({
      className: 'My Class',
      students: createDefaultStudents(),
      classSize: DEFAULT_CLASS_SIZE,
      lastSaved: null,
    })
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

  const replaceState = useCallback(
    (next: AppState) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      const saved = commitSave(normalizeState(next))
      setHistory([])
      pickerPoolRef.current = []
      return saved
    },
    [commitSave],
  )

  const setClassSize = useCallback(
    (newCount: number) => {
      const clamped = Math.min(MAX_CLASS_SIZE, Math.max(MIN_CLASS_SIZE, newCount))

      updateState((prev) => {
        if (clamped === prev.classSize) return prev

        const students = ensureStudentSlots(prev.students, Math.max(clamped, prev.students.length))
        const validIds = new Set(students.slice(0, clamped).map((s) => s.id))
        pickerPoolRef.current = pickerPoolRef.current.filter((id) => validIds.has(id))

        return { ...prev, classSize: clamped, students }
      })
    },
    [updateState],
  )

  const pickRandomStudent = useCallback((): {
    student: Student | null
    remaining: number
    cycleSize: number
  } => {
    const present = presentStudents(getVisibleStudents(state))
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
  }, [state.classSize, state.students])

  const resetPickerCycle = useCallback(() => {
    pickerPoolRef.current = []
  }, [])

  const shuffleClassOrder = useCallback((): Student[] => {
    return shuffle(presentStudents(getVisibleStudents(state)))
  }, [state.classSize, state.students])

  useEffect(() => {
    return subscribeClassroomSync((message) => {
      if (message.sourceId === MAIN_SYNC_SOURCE) return

      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }

      const saved = saveState(message.state)
      setState(saved)
      setSaveStatus('saved')
    })
  }, [])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== APP_STATE_STORAGE_KEY || !event.newValue) return
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      setState(loadState())
      setSaveStatus('saved')
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const poll = () => {
      const pip = window.documentPictureInPicture?.window
      if (!pip || pip.closed) return
      const fresh = loadState()
      setState((prev) => {
        if (fresh.lastSaved === prev.lastSaved) return prev
        if (saveTimer.current) {
          clearTimeout(saveTimer.current)
          saveTimer.current = null
        }
        queueMicrotask(() => setSaveStatus('saved'))
        return fresh
      })
    }

    const id = window.setInterval(poll, 300)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const visibleStudents = getVisibleStudents(state)
  const totalTallies = visibleStudents.reduce((sum, s) => sum + s.tally, 0)
  const presentCount = presentStudents(visibleStudents).length
  const absentCount = visibleStudents.length - presentCount
  const assignedCount = state.students
    .slice(0, state.classSize)
    .filter((student, index) => isAssignedStudent(student, index)).length

  return {
    state,
    saveStatus,
    history,
    totalTallies,
    presentCount,
    absentCount,
    assignedCount,
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
    replaceState,
    setClassSize,
    pickRandomStudent,
    resetPickerCycle,
    shuffleClassOrder,
  }
}
