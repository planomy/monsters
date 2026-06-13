import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDefaultPoll } from '../data/pollDefaults'
import type { ChartType, MorningPollState, PollOption, PollQuestion } from '../types'

const STORAGE_KEY = 'monsterz-morning-poll'
const STORAGE_VERSION = 2

interface StoredPayload {
  version: number
  poll: MorningPollState
}

interface LegacyPollState {
  question: string
  options: PollOption[]
  responses: Record<string, string>
  chartType: ChartType
}

function createOptionId(): string {
  return `opt-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
}

function migrateLegacyPoll(legacy: LegacyPollState): MorningPollState {
  const defaults = createDefaultPoll()
  return {
    questions: [
      {
        id: 'q-1',
        question: legacy.question,
        options: legacy.options,
        responses: legacy.responses ?? {},
      },
      defaults.questions[1],
    ],
    activeQuestionIndex: 0,
    chartType: legacy.chartType ?? 'bar',
  }
}

function normalizePoll(poll: MorningPollState): MorningPollState {
  const defaults = createDefaultPoll()
  const questions = poll.questions?.length
    ? poll.questions.map((q, i) => ({
        id: q.id ?? defaults.questions[i]?.id ?? `q-${i + 1}`,
        question: q.question ?? '',
        options: q.options?.length ? q.options : (defaults.questions[i]?.options ?? []),
        responses: q.responses ?? {},
      }))
    : defaults.questions

  while (questions.length < 2) {
    questions.push(defaults.questions[questions.length])
  }

  return {
    questions: questions.slice(0, 2),
    activeQuestionIndex: 0,
    chartType: poll.chartType ?? 'bar',
  }
}

function isLegacyPoll(poll: unknown): poll is LegacyPollState {
  return (
    typeof poll === 'object' &&
    poll !== null &&
    'question' in poll &&
    'options' in poll &&
    !('questions' in poll)
  )
}

function loadPoll(): MorningPollState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultPoll()

    const parsed = JSON.parse(raw) as StoredPayload
    if (parsed.version === 1 && isLegacyPoll(parsed.poll)) {
      return migrateLegacyPoll(parsed.poll)
    }
    if (parsed.version === STORAGE_VERSION && parsed.poll?.questions?.length) {
      return normalizePoll(parsed.poll)
    }
    return createDefaultPoll()
  } catch {
    return createDefaultPoll()
  }
}

function savePoll(poll: MorningPollState): void {
  const payload: StoredPayload = { version: STORAGE_VERSION, poll }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
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
  return question.options.map((option) => {
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
        if (q.options.length <= 2) return q
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
    getCountsForQuestion,
    getAnswerLabel,
    getAnswerSummary,
  }
}

export type { PollOption }
