import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDefaultPoll } from '../data/pollDefaults'
import type { ChartType, MorningPollState, PollOption } from '../types'

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
    activeQuestionIndex: poll.activeQuestionIndex === 1 ? 1 : 0,
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

export function useMorningPoll() {
  const [poll, setPoll] = useState<MorningPollState>(() => loadPoll())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeQuestion = poll.questions[poll.activeQuestionIndex]

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

  const updateActiveQuestion = useCallback(
    (updater: (question: MorningPollState['questions'][number]) => MorningPollState['questions'][number]) => {
      updatePoll((prev) => ({
        ...prev,
        questions: prev.questions.map((q, i) =>
          i === prev.activeQuestionIndex ? updater(q) : q,
        ),
      }))
    },
    [updatePoll],
  )

  const setActiveQuestionIndex = useCallback(
    (index: number) => {
      updatePoll((prev) => ({
        ...prev,
        activeQuestionIndex: index === 1 ? 1 : 0,
      }))
    },
    [updatePoll],
  )

  const setQuestion = useCallback(
    (index: number, question: string) => {
      updatePoll((prev) => ({
        ...prev,
        activeQuestionIndex: index,
        questions: prev.questions.map((q, i) => (i === index ? { ...q, question } : q)),
      }))
    },
    [updatePoll],
  )

  const setChartType = useCallback(
    (chartType: ChartType) => {
      updatePoll((prev) => ({ ...prev, chartType }))
    },
    [updatePoll],
  )

  const addOption = useCallback(() => {
    updateActiveQuestion((q) => ({
      ...q,
      options: [...q.options, { id: createOptionId(), label: `Option ${q.options.length + 1}` }],
    }))
  }, [updateActiveQuestion])

  const updateOptionLabel = useCallback(
    (optionId: string, label: string) => {
      updateActiveQuestion((q) => ({
        ...q,
        options: q.options.map((o) => (o.id === optionId ? { ...o, label } : o)),
      }))
    },
    [updateActiveQuestion],
  )

  const removeOption = useCallback(
    (optionId: string) => {
      updateActiveQuestion((q) => {
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
    [updateActiveQuestion],
  )

  const recordResponse = useCallback(
    (studentId: string, optionId: string): boolean => {
      let isFirstGreet = false
      updatePoll((prev) => {
        isFirstGreet = !prev.questions.some((q) => studentId in q.responses)
        return {
          ...prev,
          questions: prev.questions.map((q, i) =>
            i === prev.activeQuestionIndex
              ? { ...q, responses: { ...q.responses, [studentId]: optionId } }
              : q,
          ),
        }
      })
      return isFirstGreet
    },
    [updatePoll],
  )

  const clearResponses = useCallback(() => {
    updateActiveQuestion((q) => ({ ...q, responses: {} }))
  }, [updateActiveQuestion])

  const resetPoll = useCallback(() => {
    const next = createDefaultPoll()
    setPoll(next)
    savePoll(next)
  }, [])

  const getCounts = useCallback((): PollCounts[] => {
    const responses = activeQuestion.responses
    const total = Object.keys(responses).length
    return activeQuestion.options.map((option) => {
      const count = Object.values(responses).filter((id) => id === option.id).length
      return {
        optionId: option.id,
        label: option.label,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
  }, [activeQuestion])

  const getAnswerLabel = useCallback(
    (studentId: string): string | null => {
      const optionId = activeQuestion.responses[studentId]
      if (!optionId) return null
      return activeQuestion.options.find((o) => o.id === optionId)?.label ?? null
    },
    [activeQuestion],
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const respondedCount = Object.keys(activeQuestion.responses).length

  const counts = useMemo(() => getCounts(), [getCounts])

  return {
    poll,
    activeQuestion,
    activeQuestionIndex: poll.activeQuestionIndex,
    respondedCount,
    counts,
    setActiveQuestionIndex,
    setQuestion,
    setChartType,
    addOption,
    updateOptionLabel,
    removeOption,
    recordResponse,
    clearResponses,
    resetPoll,
    getAnswerLabel,
  }
}

export type { PollOption }
