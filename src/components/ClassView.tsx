import { useState } from 'react'
import type { Student } from '../types'
import type { useMorningPoll } from '../hooks/useMorningPoll'
import { AnswerPickerModal, type GreetAnchor } from './AnswerPickerModal'
import { QuestionsPanel } from './QuestionsPanel'
import { StudentGrid } from './StudentGrid'
import { ConfirmModal } from './ConfirmModal'

type PollApi = ReturnType<typeof useMorningPoll>

interface ClassViewProps {
  students: Student[]
  presentCount: number
  highlightedStudentId?: string | null
  questionsExpanded: boolean
  onQuestionsExpandedChange: (expanded: boolean) => void
  pollApi: PollApi
  onGreetAnswer: (studentId: string, optionId: string) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRename: (id: string, name: string) => void
  onToggleAbsent: (id: string) => void
}

export function ClassView({
  students,
  presentCount,
  highlightedStudentId,
  questionsExpanded,
  onQuestionsExpandedChange,
  pollApi,
  onGreetAnswer,
  onIncrement,
  onDecrement,
  onRename,
  onToggleAbsent,
}: ClassViewProps) {
  const { activeQuestion, activeQuestionIndex, clearResponses, resetPoll } = pollApi

  const [picker, setPicker] = useState<{ student: Student; anchor: GreetAnchor } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleSelectAnswer = (optionId: string) => {
    if (!picker) return
    onGreetAnswer(picker.student.id, optionId)
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
            presentCount={presentCount}
            onHide={() => onQuestionsExpandedChange(false)}
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
          getPollAnswerLabel={questionsExpanded ? pollApi.getAnswerLabel : undefined}
          onGreet={
            questionsExpanded
              ? (id, anchor) => {
                  const student = students.find((s) => s.id === id)
                  if (student) setPicker({ student, anchor })
                }
              : undefined
          }
          onIncrement={questionsExpanded ? undefined : onIncrement}
          onDecrement={questionsExpanded ? undefined : onDecrement}
          onRename={onRename}
          onToggleAbsent={onToggleAbsent}
        />
        </div>
      </div>

      {picker && (
        <AnswerPickerModal
          student={picker.student}
          options={activeQuestion.options}
          currentOptionId={activeQuestion.responses[picker.student.id] ?? null}
          anchor={picker.anchor}
          onSelect={handleSelectAnswer}
          onClose={() => setPicker(null)}
        />
      )}

      {confirmClear && (
        <ConfirmModal
          title={`Clear Q${activeQuestionIndex + 1} responses?`}
          message="Remove every recorded answer for this question. Tallies stay the same."
          confirmLabel="Clear responses"
          onConfirm={() => {
            clearResponses()
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
