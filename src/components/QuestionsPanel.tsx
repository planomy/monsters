import { PollChart } from './PollChart'
import type { useMorningPoll } from '../hooks/useMorningPoll'

type PollApi = ReturnType<typeof useMorningPoll>

interface QuestionsPanelProps {
  pollApi: PollApi
  presentCount: number
  onHide: () => void
  onClear: () => void
  onReset: () => void
}

export function QuestionsPanel({
  pollApi,
  presentCount,
  onHide,
  onClear,
  onReset,
}: QuestionsPanelProps) {
  const {
    poll,
    activeQuestion,
    activeQuestionIndex,
    respondedCount,
    counts,
    setActiveQuestionIndex,
    setQuestion,
    setChartType,
    addOption,
    updateOptionLabel,
    removeOption,
  } = pollApi

  return (
    <div className="q-panel">
      <header className="q-panel__head">
        <div className="q-panel__head-left">
          <div className="q-panel__tabs" role="tablist" aria-label="Questions">
            {poll.questions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                role="tab"
                aria-selected={activeQuestionIndex === index}
                className={
                  activeQuestionIndex === index ? 'q-panel__tab q-panel__tab--active' : 'q-panel__tab'
                }
                onClick={() => setActiveQuestionIndex(index)}
              >
                Q{index + 1}
              </button>
            ))}
          </div>
          <input
            className="q-panel__question"
            value={activeQuestion.question}
            onChange={(e) => setQuestion(activeQuestionIndex, e.target.value)}
            placeholder="Type your question…"
            aria-label={`Question ${activeQuestionIndex + 1}`}
          />
        </div>

        <div className="q-panel__head-right">
          <span className="q-panel__stat">
            <strong>{respondedCount}</strong> / {presentCount} answered
          </span>
          <div className="q-panel__chart-toggle" role="group" aria-label="Chart type">
            <button
              type="button"
              className={poll.chartType === 'bar' ? 'q-panel__pill q-panel__pill--on' : 'q-panel__pill'}
              aria-pressed={poll.chartType === 'bar'}
              onClick={() => setChartType('bar')}
            >
              Bar
            </button>
            <button
              type="button"
              className={poll.chartType === 'pie' ? 'q-panel__pill q-panel__pill--on' : 'q-panel__pill'}
              aria-pressed={poll.chartType === 'pie'}
              onClick={() => setChartType('pie')}
            >
              Pie
            </button>
          </div>
          <button type="button" className="q-panel__pill" onClick={onClear}>
            Clear
          </button>
          <button type="button" className="q-panel__pill" onClick={onReset}>
            Reset
          </button>
          <button type="button" className="q-panel__hide" onClick={onHide}>
            Hide ▲
          </button>
        </div>
      </header>

      <div className="q-panel__main">
        <aside className="q-panel__aside">
          <span className="q-panel__aside-label">Answer options</span>
          <ul
            className={
              activeQuestion.options.length >= 6
                ? 'q-panel__options q-panel__options--extra-dense'
                : activeQuestion.options.length >= 5
                  ? 'q-panel__options q-panel__options--dense'
                  : 'q-panel__options'
            }
          >
            {activeQuestion.options.map((option) => (
              <li key={option.id} className="q-panel__option">
                <input
                  className="q-panel__option-input"
                  value={option.label}
                  onChange={(e) => updateOptionLabel(option.id, e.target.value)}
                  aria-label={`Option ${option.label}`}
                />
                <button
                  type="button"
                  className="q-panel__option-remove"
                  onClick={() => removeOption(option.id)}
                  disabled={activeQuestion.options.length <= 2}
                  aria-label={`Remove ${option.label}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="q-panel__add" onClick={addOption}>
            + Add option
          </button>
        </aside>

        <div className="q-panel__chart">
          <PollChart
            fill
            chartType={poll.chartType}
            counts={counts}
            totalResponses={respondedCount}
          />
        </div>
      </div>
    </div>
  )
}
