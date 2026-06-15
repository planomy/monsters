import { createDefaultPoll, POLL_OPTION_COUNT } from '../data/pollDefaults'
import type { ChartType, MorningPollState, PollOption, PollQuestion } from '../types'

export const POLL_STORAGE_KEY = 'monsterz-morning-poll'
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

export function createPollOptionId(): string {
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

function normalizeQuestionOptions(
  options: PollOption[] | undefined,
  questionIndex: number,
  defaults: PollQuestion[],
): PollOption[] {
  const fallback = defaults[questionIndex]?.options ?? []
  const base = options?.length ? [...options] : [...fallback]

  while (base.length < POLL_OPTION_COUNT) {
    base.push({ id: createPollOptionId(), label: '' })
  }

  return base.slice(0, POLL_OPTION_COUNT)
}

export function normalizePoll(poll: MorningPollState): MorningPollState {
  const defaults = createDefaultPoll()
  const questions = poll.questions?.length
    ? poll.questions.map((q, i) => ({
        id: q.id ?? defaults.questions[i]?.id ?? `q-${i + 1}`,
        question: q.question ?? '',
        options: normalizeQuestionOptions(q.options, i, defaults.questions),
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

export function loadPoll(): MorningPollState {
  try {
    const raw = localStorage.getItem(POLL_STORAGE_KEY)
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

export function savePoll(poll: MorningPollState): void {
  const payload: StoredPayload = { version: STORAGE_VERSION, poll: normalizePoll(poll) }
  try {
    localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}
