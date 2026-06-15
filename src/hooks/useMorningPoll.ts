import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDefaultPoll, POLL_OPTION_COUNT } from '../data/pollDefaults'
import {
  applyQuestion2Prompt,
  pickRandomQuestion2Prompt,
} from '../data/funQuestion2Prompts'
import type { ChartType, MorningPollState, PollOption, PollQuestion } from '../types'
import { createPollOptionId, loadPoll, normalizePoll, savePoll } from '../utils/pollStorage'

function createOptionId(): string {
  return createPollOptionId()
}

export interface PollCounts {
  optionId: string
  label: string
  count: number
  percentage: number
}

function computeCounts(question: PollQuestion): PollCounts[] {
  const responses = question.responses
  const total = Object.keys(responses).length
  const visibleOptions = question.options.filter((option) => option.label.trim())
  return visibleOptions.map((option) => {
    const count = Object.values(responses).filter((id) => id === option.id).length
    return {
      optionId: option.id,
      label: option.label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })
}

function countFullyResponded(questions: PollQuestion[]): number {
  if (questions.length === 0) return 0
  const responseSets = questions.map((q) => new Set(Object.keys(q.responses)))
  let count = 0
  for (const studentId of responseSets[0]) {
    if (responseSets.every((set) => set.has(studentId))) count++
  }
  return count
}

export function useMorningPoll() {
  const [poll, setPoll] = useState<MorningPollState>(() => loadPoll())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((next: MorningPollState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      savePoll(next)
    }, 300)
  }, [])

  const updatePoll = useCallback(
    (updater: (prev: MorningPollState) => MorningPollState) => {
      setPoll((prev) => {
        const next = updater(prev)
        persist(next)
        return next
      })
    },
    [persist],
  )

  const updateQuestion = useCallback(
    (
      questionIndex: number,
      updater: (question: PollQuestion) => PollQuestion,
    ) => {
      updatePoll((prev) => ({
        ...prev,
        questions: prev.questions.map((q, i) => (i === questionIndex ? updater(q) : q)),
      }))
    },
    [updatePoll],
  )

  const setQuestion = useCallback(
    (index: number, question: string) => {
      updateQuestion(index, (q) => ({ ...q, question }))
    },
    [updateQuestion],
  )

  const setChartType = useCallback(
    (chartType: ChartType) => {
      updatePoll((prev) => ({ ...prev, chartType }))
    },
    [updatePoll],
  )

  const addOption = useCallback(
    (questionIndex: number) => {
      updateQuestion(questionIndex, (q) => ({
        ...q,
        options: [...q.options, { id: createOptionId(), label: `Option ${q.options.length + 1}` }],
      }))
    },
    [updateQuestion],
  )

  const updateOptionLabel = useCallback(
    (questionIndex: number, optionId: string, label: string) => {
      updateQuestion(questionIndex, (q) => ({
        ...q,
        options: q.options.map((o) => (o.id === optionId ? { ...o, label } : o)),
      }))
    },
    [updateQuestion],
  )

  const removeOption = useCallback(
    (questionIndex: number, optionId: string) => {
      updateQuestion(questionIndex, (q) => {
        if (q.options.length <= POLL_OPTION_COUNT) return q
        const responses = { ...q.responses }
        for (const [studentId, answerId] of Object.entries(responses)) {
          if (answerId === optionId) delete responses[studentId]
        }
        return {
          ...q,
          options: q.options.filter((o) => o.id !== optionId),
          responses,
        }
      })
    },
    [updateQuestion],
  )

  const recordResponse = useCallback(
    (studentId: string, questionIndex: number, optionId: string): boolean => {
      let isFirstGreet = false
      updatePoll((prev) => {
        isFirstGreet = !prev.questions.some((q) => studentId in q.responses)
        return {
          ...prev,
          questions: prev.questions.map((q, i) =>
            i === questionIndex
              ? { ...q, responses: { ...q.responses, [studentId]: optionId } }
              : q,
          ),
        }
      })
      return isFirstGreet
    },
    [updatePoll],
  )

  const clearAllResponses = useCallback(() => {
    updatePoll((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => ({ ...q, responses: {} })),
    }))
  }, [updatePoll])

  const pruneResponses = useCallback((validStudentIds: Set<string>) => {
    updatePoll((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => ({
        ...q,
        responses: Object.fromEntries(
          Object.entries(q.responses).filter(([studentId]) => validStudentIds.has(studentId)),
        ),
      })),
    }))
  }, [updatePoll])

  const resetPoll = useCallback(() => {
    const next = createDefaultPoll()
    setPoll(next)
    savePoll(next)
  }, [])

  const replacePoll = useCallback((next: MorningPollState) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    const normalized = normalizePoll(next)
    setPoll(normalized)
    savePoll(normalized)
  }, [])

  const randomizeQuestion2 = useCallback(() => {
    updatePoll((prev) => {
      const current = prev.questions[1]
      if (!current) return prev
      const prompt = pickRandomQuestion2Prompt(current.question)
      return {
        ...prev,
        questions: prev.questions.map((q, i) =>
          i === 1 ? applyQuestion2Prompt(q, prompt) : q,
        ),
      }
    })
  }, [updatePoll])

  const getCountsForQuestion = useCallback(
    (questionIndex: number): PollCounts[] => {
      const question = poll.questions[questionIndex]
      return question ? computeCounts(question) : []
    },
    [poll.questions],
  )

  const getAnswerLabel = useCallback(
    (studentId: string, questionIndex: number): string | null => {
      const question = poll.questions[questionIndex]
      if (!question) return null
      const optionId = question.responses[studentId]
      if (!optionId) return null
      return question.options.find((o) => o.id === optionId)?.label ?? null
    },
    [poll.questions],
  )

  const getAnswerSummary = useCallback(
    (studentId: string): string | null => {
      const parts = poll.questions.map((q) => {
        const optionId = q.responses[studentId]
        if (!optionId) return null
        return q.options.find((o) => o.id === optionId)?.label ?? null
      })
      if (parts.every((p) => !p)) return null
      return parts.map((p) => p ?? '—').join(' · ')
    },
    [poll.questions],
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const countsByQuestion = useMemo(
    () => poll.questions.map((q) => computeCounts(q)),
    [poll.questions],
  )

  const respondedCountByQuestion = useMemo(
    () => poll.questions.map((q) => Object.keys(q.responses).length),
    [poll.questions],
  )

  const fullyRespondedCount = useMemo(
    () => countFullyResponded(poll.questions),
    [poll.questions],
  )

  return {
    poll,
    countsByQuestion,
    respondedCountByQuestion,
    fullyRespondedCount,
    setQuestion,
    setChartType,
    addOption,
    updateOptionLabel,
    removeOption,
    recordResponse,
    clearAllResponses,
    pruneResponses,
    resetPoll,
    replacePoll,
    randomizeQuestion2,
    getCountsForQuestion,
    getAnswerLabel,
    getAnswerSummary,
  }
}

export type { PollOption }
