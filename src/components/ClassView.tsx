import { useMemo, useState } from 'react'
import type { Student } from '../types'
import type { useMorningPoll } from '../hooks/useMorningPoll'
import { AnswerPickerModal, type GreetAnchor } from './AnswerPickerModal'
import { QuestionsPanel } from './QuestionsPanel'
import { StudentGrid } from './StudentGrid'
import { ConfirmModal } from './ConfirmModal'

type PollApi = ReturnType<typeof useMorningPoll>

interface ClassViewProps {
  students: Student[]
  highlightedStudentId?: string | null
  questionsExpanded: boolean
  pollApi: PollApi
  onGreetAnswer: (studentId: string, questionIndex: number, optionId: string) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRename: (id: string, name: string) => void
}

export function ClassView({
  students,
  highlightedStudentId,
  questionsExpanded,
  pollApi,
  onGreetAnswer,
  onIncrement,
  onDecrement,
  onRename,
}: ClassViewProps) {
  const { poll, clearAllResponses, resetPoll } = pollApi

  const [picker, setPicker] = useState<{ student: Student; anchor: GreetAnchor } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const pickerQuestions = useMemo(() => {
    if (!picker) return []
    return poll.questions.map((question, index) => ({
      index,
      title: question.question,
      options: question.options,
      selectedOptionId: question.responses[picker.student.id] ?? null,
    }))
  }, [picker, poll.questions])

  const handleSelectAnswer = (questionIndex: number, optionId: string) => {
    if (!picker) return
    onGreetAnswer(picker.student.id, questionIndex, optionId)
  }

  return (
    <div
      className={
        questionsExpanded
          ? 'classroom classroom--expanded'
          : 'classroom classroom--collapsed'
      }
    >
      {questionsExpanded && (
        <div className="classroom__questions">
          <QuestionsPanel
            pollApi={pollApi}
            onClear={() => setConfirmClear(true)}
            onReset={() => setConfirmReset(true)}
          />
        </div>
      )}

      <div className="classroom__students">
        <div className="classroom__students-scroll">
          <StudentGrid
            students={students}
            highlightedStudentId={highlightedStudentId}
            pollMode={questionsExpanded}
            getPollQ1AnswerLabel={
              questionsExpanded ? (id) => pollApi.getAnswerLabel(id, 0) : undefined
            }
            getPollQ2AnswerLabel={
              questionsExpanded ? (id) => pollApi.getAnswerLabel(id, 1) : undefined
            }
            onGreet={
              questionsExpanded
                ? (id, anchor) => {
                    const student = students.find((s) => s.id === id)
                    if (student) setPicker({ student, anchor })
                  }
                : undefined
            }
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            onRename={onRename}
          />
        </div>
      </div>

      {picker && (
        <AnswerPickerModal
          student={picker.student}
          questions={pickerQuestions}
          anchor={picker.anchor}
          onSelect={handleSelectAnswer}
          onClose={() => setPicker(null)}
        />
      )}

      {confirmClear && (
        <ConfirmModal
          title="Clear all responses?"
          message="Remove every recorded answer for both questions. Tallies stay the same."
          confirmLabel="Clear responses"
          onConfirm={() => {
            clearAllResponses()
            setConfirmClear(false)
          }}
          onCancel={() => setConfirmClear(false)}
        />
      )}

      {confirmReset && (
        <ConfirmModal
          title="Reset morning questions?"
          message="Restore both default questions, options, and clear all responses."
          confirmLabel="Reset questions"
          onConfirm={() => {
            resetPoll()
            setConfirmReset(false)
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}
