import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppState, MorningPollState } from '../types'
import {
  addNewClass,
  deleteSavedClass,
  duplicateSavedClass,
  loadClassLibrary,
  renameSavedClass,
  switchActiveClass,
  upsertActiveClass,
  writeClassLibrary,
  type ClassLibrary,
  type SavedClass,
} from '../utils/classLibrary'

interface UseClassLibraryOptions {
  appState: AppState
  poll: MorningPollState
  replaceAppState: (state: AppState) => void
  replacePoll: (poll: MorningPollState) => void
}

export function useClassLibrary({
  appState,
  poll,
  replaceAppState,
  replacePoll,
}: UseClassLibraryOptions) {
  const [library, setLibrary] = useState<ClassLibrary>(() => loadClassLibrary())
  const libraryRef = useRef(library)
  libraryRef.current = library
  const switchingRef = useRef(false)

  useEffect(() => {
    if (switchingRef.current) return

    const timer = window.setTimeout(() => {
      setLibrary((prev) => {
        const next = upsertActiveClass(prev, appState, poll)
        writeClassLibrary(next)
        return next
      })
    }, 600)

    return () => window.clearTimeout(timer)
  }, [appState, poll])

  const switchToClass = useCallback(
    (classId: string) => {
      switchingRef.current = true
      const result = switchActiveClass(libraryRef.current, classId, appState, poll)
      if (result) {
        setLibrary(result.library)
        replaceAppState(result.appState)
        replacePoll(result.poll)
      }
      window.setTimeout(() => {
        switchingRef.current = false
      }, 50)
    },
    [appState, poll, replaceAppState, replacePoll],
  )

  const createClass = useCallback(
    (name: string) => {
      switchingRef.current = true
      const result = addNewClass(libraryRef.current, appState, poll, name)
      setLibrary(result.library)
      replaceAppState(result.appState)
      replacePoll(result.poll)
      window.setTimeout(() => {
        switchingRef.current = false
      }, 50)
    },
    [appState, poll, replaceAppState, replacePoll],
  )

  const deleteClass = useCallback(
    (classId: string) => {
      switchingRef.current = true
      const result = deleteSavedClass(libraryRef.current, classId, appState, poll)
      if (!result) {
        switchingRef.current = false
        return false
      }

      setLibrary(result.library)
      if (result.appState && result.poll) {
        replaceAppState(result.appState)
        replacePoll(result.poll)
      }
      window.setTimeout(() => {
        switchingRef.current = false
      }, 50)
      return true
    },
    [appState, poll, replaceAppState, replacePoll],
  )

  const renameClass = useCallback(
    (classId: string, name: string) => {
      switchingRef.current = true
      const result = renameSavedClass(libraryRef.current, classId, appState, poll, name)
      if (!result) {
        switchingRef.current = false
        return false
      }

      setLibrary(result.library)
      if (result.appState) {
        replaceAppState(result.appState)
      }
      window.setTimeout(() => {
        switchingRef.current = false
      }, 50)
      return true
    },
    [appState, poll, replaceAppState],
  )

  const duplicateClass = useCallback(
    (classId: string, name: string) => {
      switchingRef.current = true
      const result = duplicateSavedClass(libraryRef.current, classId, appState, poll, name)
      if (!result) {
        switchingRef.current = false
        return false
      }

      setLibrary(result.library)
      replaceAppState(result.appState)
      replacePoll(result.poll)
      window.setTimeout(() => {
        switchingRef.current = false
      }, 50)
      return true
    },
    [appState, poll, replaceAppState, replacePoll],
  )

  const savedClasses: SavedClass[] = library.classes
  const activeClassId = library.activeId

  return {
    savedClasses,
    activeClassId,
    switchToClass,
    createClass,
    deleteClass,
    renameClass,
    duplicateClass,
  }
}
