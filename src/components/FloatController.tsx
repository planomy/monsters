import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { getDailyMonsterIndex } from '../utils/dailyMonster'
import { getVisibleStudents, isAssignedStudent } from '../data/defaults'
import { FLOAT_SYNC_SOURCE, subscribeClassroomSync } from '../utils/classroomSync'
import { PIP_WINDOW_W, pipPillWindowHeight } from '../utils/floatLayout'
import { activateEmbeddedStorage, APP_STATE_STORAGE_KEY, loadState } from '../utils/storage'
import { commitIncrementTally, commitRewardAll } from '../utils/tallyActions'
import { commitPickStudent, type PickResult } from '../utils/pickerActions'
import {
  measureFloatContentHeight,
  resizePipToContentHeight,
} from '../utils/pipWindowSize'
import { FloatStudentGrid } from './FloatStudentGrid'
import { MonsterAvatar } from './MonsterAvatar'

export { FLOAT_PILL as FLOAT_PILL_SIZE } from '../utils/floatLayout'

export const FLOAT_MONSTER_SIZE = 20

interface FloatControllerProps {
  pipWindow: Window
}

export function FloatController({ pipWindow }: FloatControllerProps) {
  const [expanded, setExpanded] = useState(false)
  const [scrollable, setScrollable] = useState(false)
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null)
  const [pickResult, setPickResult] = useState<PickResult | null>(null)
  const [state, setState] = useState(() => loadState())
  const panelRef = useRef<HTMLDivElement>(null)
  const dailyMonsterIndex = getDailyMonsterIndex()
  const visibleStudents = useMemo(() => getVisibleStudents(state), [state])
  const assignedCount = useMemo(
    () =>
      state.students
        .slice(0, state.classSize)
        .filter((student, index) => isAssignedStudent(student, index)).length,
    [state],
  )
  const presentCount = useMemo(
    () => visibleStudents.filter((student) => student.tally > 0).length,
    [visibleStudents],
  )

  const highlightStudent = useCallback((studentId: string) => {
    setHighlightedStudentId(studentId)
    window.setTimeout(() => setHighlightedStudentId(null), 2500)
  }, [])

  useEffect(() => {
    void activateEmbeddedStorage()
  }, [])

  useEffect(() => {
    return subscribeClassroomSync((message) => {
      if (message.sourceId === FLOAT_SYNC_SOURCE) return
      setState(message.state)
      if (message.highlightStudentId) {
        highlightStudent(message.highlightStudentId)
      }
    })
  }, [highlightStudent])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== APP_STATE_STORAGE_KEY || !event.newValue) return
      setState(loadState())
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const resizeToPill = useCallback(() => {
    setScrollable(false)
    resizePipToContentHeight(pipWindow, PIP_WINDOW_W, pipPillWindowHeight())
  }, [pipWindow])

  const resizeToPanel = useCallback(() => {
    const contentHeight = measureFloatContentHeight(pipWindow)
    if (contentHeight <= 0) return

    const screenLimit = pipWindow.screen.availHeight - 8
    const needsScroll = contentHeight > screenLimit
    const targetHeight = needsScroll ? screenLimit : contentHeight

    setScrollable(needsScroll)
    resizePipToContentHeight(pipWindow, PIP_WINDOW_W, targetHeight)
  }, [pipWindow])

  useLayoutEffect(() => {
    if (!expanded) return
    resizeToPanel()
    pipWindow.requestAnimationFrame(resizeToPanel)
  }, [expanded, state.classSize, pickResult, resizeToPanel, pipWindow])

  const expand = () => {
    flushSync(() => setExpanded(true))
  }

  const collapse = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    flushSync(() => setExpanded(false))
    resizeToPill()
  }

  const awardPoint = (studentId: string) => {
    void activateEmbeddedStorage().then(() => {
      const next = commitIncrementTally(studentId, FLOAT_SYNC_SOURCE)
      if (next) {
        setState(next)
        highlightStudent(studentId)
      }
    })
  }

  const handleRewardAll = () => {
    void activateEmbeddedStorage().then(() => {
      const next = commitRewardAll(FLOAT_SYNC_SOURCE)
      if (next) setState(next)
    })
  }

  const handlePick = () => {
    void activateEmbeddedStorage().then(() => {
      const { result } = commitPickStudent(FLOAT_SYNC_SOURCE)
      setPickResult(result)
      if (result.student) highlightStudent(result.student.id)
    })
  }

  const dismissPick = () => {
    setPickResult(null)
  }

  const pickNote =
    pickResult && pickResult.cycleSize > 0
      ? pickResult.remaining > 0
        ? `${pickResult.remaining} left this round`
        : 'Next pick starts a new round'
      : null

  if (!expanded) {
    return (
      <div className="float-pill-shell">
        <button
          type="button"
          className="float-pill"
          onClick={expand}
          aria-label={`Open ${state.className} float controller`}
          title={state.className}
        >
          <MonsterAvatar index={dailyMonsterIndex} name="Monsterz" size={FLOAT_MONSTER_SIZE} />
        </button>
      </div>
    )
  }

  const panelClass = scrollable ? 'float-panel float-panel--scroll' : 'float-panel'

  return (
    <div ref={panelRef} className={panelClass}>
      <div className="float-panel__head">
        <button
          type="button"
          className="float-panel__minimize"
          onClick={collapse}
          aria-label="Minimize to daily monster pill"
          title="Minimize"
        >
          ▾
        </button>
        <div className="float-panel__tools">
          <button
            type="button"
            className="float-panel__tool float-panel__tool--pick"
            onClick={handlePick}
            disabled={presentCount === 0}
            title={presentCount === 0 ? 'No students logged on yet' : 'Pick random student'}
          >
            PICK
          </button>
          <button
            type="button"
            className="float-panel__tool float-panel__tool--reward"
            onClick={handleRewardAll}
            disabled={assignedCount === 0}
            title={
              assignedCount === 0
                ? 'Rename at least one student to enable reward all'
                : `Reward ${assignedCount} named students`
            }
          >
            REWARD ALL
          </button>
        </div>
      </div>

      {pickResult && (
        <div className="float-panel__pick" aria-live="polite">
          <div className="float-panel__pick-actions">
            <button
              type="button"
              className="float-panel__pick-action"
              onClick={handlePick}
              disabled={pickResult.cycleSize === 0}
              aria-label="Pick again"
              title="Pick again"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="float-panel__pick-action-icon">
                <path
                  fill="currentColor"
                  d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l1.46 1.46C18.07 15.38 19 13.79 19 12c0-3.87-3.13-7-7-7zm-5 5c0-.65.13-1.26.36-1.83L5.9 7.71C5.93 8.46 6 9.21 6 10c0 3.87 3.13 7 7 7v3l4-4-4-4v3c-2.76 0-5-2.24-5-5z"
                />
              </svg>
            </button>
            <button
              type="button"
              className="float-panel__pick-action float-panel__pick-action--close"
              onClick={dismissPick}
              aria-label="Close picked student"
              title="Close"
            >
              ×
            </button>
          </div>

          {pickResult.student ? (
            <div className="float-panel__pick-body">
              <span className="float-panel__pick-label">Picked</span>
              <span className="float-panel__pick-name">{pickResult.student.name}</span>
              {pickNote && <span className="float-panel__pick-meta">{pickNote}</span>}
            </div>
          ) : (
            <div className="float-panel__pick-body">
              <span className="float-panel__pick-meta">No students logged on yet</span>
            </div>
          )}
        </div>
      )}

      <div className="float-panel__body">
        <FloatStudentGrid
          students={visibleStudents}
          highlightedStudentId={highlightedStudentId}
          onIncrement={awardPoint}
        />
      </div>
    </div>
  )
}
