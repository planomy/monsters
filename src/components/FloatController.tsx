import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { getDailyMonsterIndex } from '../utils/dailyMonster'
import { FLOAT_SYNC_SOURCE, subscribeClassroomSync } from '../utils/classroomSync'
import { PIP_WINDOW_W, pipPillWindowHeight } from '../utils/floatLayout'
import { activateEmbeddedStorage, loadState } from '../utils/storage'
import { commitIncrementTally } from '../utils/tallyActions'
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
  const [state, setState] = useState(() => loadState())
  const panelRef = useRef<HTMLDivElement>(null)
  const dailyMonsterIndex = getDailyMonsterIndex()

  useEffect(() => {
    void activateEmbeddedStorage()
  }, [])

  useEffect(() => {
    return subscribeClassroomSync((message) => {
      if (message.sourceId === FLOAT_SYNC_SOURCE) return
      setState(message.state)
      if (message.highlightStudentId) {
        setHighlightedStudentId(message.highlightStudentId)
        window.setTimeout(() => setHighlightedStudentId(null), 2500)
      }
    })
  }, [])

  const resizeToPill = useCallback(() => {
    setScrollable(false)
    resizePipToContentHeight(pipWindow, PIP_WINDOW_W, pipPillWindowHeight())
  }, [pipWindow])

  const resizeToPanel = useCallback(() => {
    const apply = () => {
      const contentHeight = measureFloatContentHeight(pipWindow)
      if (contentHeight <= 0) return

      const screenLimit = pipWindow.screen.availHeight - 8
      const needsScroll = contentHeight > screenLimit
      const targetHeight = needsScroll ? screenLimit : contentHeight

      setScrollable(needsScroll)
      resizePipToContentHeight(pipWindow, PIP_WINDOW_W, targetHeight)
    }

    apply()
    pipWindow.requestAnimationFrame(apply)
  }, [pipWindow])

  useLayoutEffect(() => {
    if (!expanded) return
    resizeToPanel()
  }, [expanded, state.students.length, resizeToPanel])

  useEffect(() => {
    if (!expanded) return

    const grid = panelRef.current?.querySelector('.student-grid--float')
    if (!grid || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => resizeToPanel())
    observer.observe(grid)
    return () => observer.disconnect()
  }, [expanded, resizeToPanel])

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
    const next = commitIncrementTally(state, studentId, FLOAT_SYNC_SOURCE)
    if (next) {
      setState(next)
      setHighlightedStudentId(studentId)
      window.setTimeout(() => setHighlightedStudentId(null), 2500)
    }
  }

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
      </div>

      <div className="float-panel__body">
        <FloatStudentGrid
          students={state.students}
          highlightedStudentId={highlightedStudentId}
          onIncrement={awardPoint}
        />
      </div>
    </div>
  )
}
