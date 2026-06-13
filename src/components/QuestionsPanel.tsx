import { useEffect, useRef, useState } from 'react'
import { PollChart } from './PollChart'
import type { useMorningPoll } from '../hooks/useMorningPoll'

type PollApi = ReturnType<typeof useMorningPoll>

interface QuestionsPanelProps {
  pollApi: PollApi
  onHide: () => void
  onClear: () => void
  onReset: () => void
}

function GearIcon() {
  return (
    <svg className="q-panel__gear-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
      />
    </svg>
  )
}

export function QuestionsPanel({
  pollApi,
  onHide,
  onClear,
  onReset,
}: QuestionsPanelProps) {
  const {
    poll,
    countsByQuestion,
    respondedCountByQuestion,
    setQuestion,
    setChartType,
    updateOptionLabel,
    removeOption,
  } = pollApi

  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="q-panel">
      <header className="q-panel__head">
        <div className="q-panel__head-left q-panel__head-left--dual">
          {poll.questions.map((question, index) => (
            <div key={question.id} className="q-panel__question-wrap">
              <span className="q-panel__question-badge">Q{index + 1}</span>
              <input
                className="q-panel__question"
                value={question.question}
                onChange={(e) => setQuestion(index, e.target.value)}
                placeholder={`Question ${index + 1}…`}
                aria-label={`Question ${index + 1}`}
              />
            </div>
          ))}
        </div>

        <div className="q-panel__head-right">
          <div className="q-panel__menu" ref={menuRef}>
            <button
              type="button"
              className="q-panel__gear"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Question panel settings"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <GearIcon />
            </button>

            {menuOpen && (
              <div className="q-panel__dropdown" role="menu">
                <div className="q-panel__menu-section" role="group" aria-label="Chart type">
                  <span className="q-panel__menu-label">Chart</span>
                  <div className="q-panel__menu-toggle">
                    <button
                      type="button"
                      className={
                        poll.chartType === 'bar'
                          ? 'q-panel__menu-pill q-panel__menu-pill--on'
                          : 'q-panel__menu-pill'
                      }
                      aria-pressed={poll.chartType === 'bar'}
                      onClick={() => setChartType('bar')}
                    >
                      Bar
                    </button>
                    <button
                      type="button"
                      className={
                        poll.chartType === 'pie'
                          ? 'q-panel__menu-pill q-panel__menu-pill--on'
                          : 'q-panel__menu-pill'
                      }
                      aria-pressed={poll.chartType === 'pie'}
                      onClick={() => setChartType('pie')}
                    >
                      Pie
                    </button>
                  </div>
                </div>
                <div className="q-panel__menu-divider" role="separator" />
                <button
                  type="button"
                  className="q-panel__menu-item"
                  role="menuitem"
                  onClick={() => {
                    onClear()
                    closeMenu()
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="q-panel__menu-item"
                  role="menuitem"
                  onClick={() => {
                    onReset()
                    closeMenu()
                  }}
                >
                  Reset
                </button>
                <div className="q-panel__menu-divider" role="separator" />
                <button
                  type="button"
                  className="q-panel__menu-item"
                  role="menuitem"
                  onClick={() => {
                    onHide()
                    closeMenu()
                  }}
                >
                  Hide
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="q-panel__main q-panel__main--dual">
        <div className="q-panel__config">
          {poll.questions.map((question, index) => (
            <aside key={question.id} className="q-panel__aside">
              <span className="q-panel__aside-label">Q{index + 1} options</span>
              <ul className="q-panel__options">
                {question.options.map((option) => (
                  <li key={option.id} className="q-panel__option">
                    <input
                      className="q-panel__option-input"
                      value={option.label}
                      onChange={(e) => updateOptionLabel(index, option.id, e.target.value)}
                      aria-label={`Q${index + 1} option ${option.label}`}
                    />
                    <button
                      type="button"
                      className="q-panel__option-remove"
                      onClick={() => removeOption(index, option.id)}
                      disabled={question.options.length <= 2}
                      aria-label={`Remove ${option.label}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          ))}
        </div>

        <div className="q-panel__charts">
          {poll.questions.map((question, index) => (
            <div key={question.id} className="q-panel__chart">
              <div className="q-panel__chart-head">
                <span className="q-panel__chart-badge">Q{index + 1}</span>
                <span className="q-panel__chart-title" title={question.question}>
                  {question.question}
                </span>
                <span className="q-panel__chart-stat">
                  {respondedCountByQuestion[index]} answered
                </span>
              </div>
              <PollChart
                fill
                chartType={poll.chartType}
                counts={countsByQuestion[index] ?? []}
                totalResponses={respondedCountByQuestion[index] ?? 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
