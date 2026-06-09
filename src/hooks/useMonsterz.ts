import { useCallback, useEffect, useRef, useState } from 'react'
import { createDefaultStudents } from '../data/defaults'
import type { AppState, HistoryEntry } from '../types'
import { importFromJson } from '../utils/export'
import { loadState, saveState } from '../utils/storage'

export function useMonsterz() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((next: AppState) => {
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)

    saveTimer.current = setTimeout(() => {
      const saved = saveState(next)
      setState(saved)
      setSaveStatus('saved')
    }, 400)
  }, [])

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
    updateState((prev) => ({
      ...prev,
      students: prev.students.map((s) => ({ ...s, tally: 0 })),
    }))
    setHistory([])
  }, [updateState])

  const resetToDefaults = useCallback(() => {
    const next: AppState = {
      className: 'My Class',
      students: createDefaultStudents(),
      lastSaved: null,
    }
    const saved = saveState(next)
    setState(saved)
    setHistory([])
    setSaveStatus('saved')
  }, [])

  const manualSave = useCallback(() => {
    const saved = saveState(state)
    setState(saved)
    setSaveStatus('saved')
  }, [state])

  const importState = useCallback(async (file: File) => {
    const imported = await importFromJson(file)
    const saved = saveState(imported)
    setState(saved)
    setHistory([])
    setSaveStatus('saved')
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const totalTallies = state.students.reduce((sum, s) => sum + s.tally, 0)

  return {
    state,
    saveStatus,
    history,
    totalTallies,
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
  }
}
