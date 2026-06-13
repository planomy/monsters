import type { MorningPollState, PollQuestion } from '../types'
import { createDefaultQuestion2 } from './funQuestion2Prompts'

export const POLL_OPTION_COUNT = 4

function createQuestion(
  id: string,
  question: string,
  options: { id: string; label: string }[],
): PollQuestion {
  return { id, question, options, responses: {} }
}

export function createDefaultPoll(): MorningPollState {
  const question2 = createDefaultQuestion2()

  return {
    questions: [
      createQuestion('q-1', 'How are you feeling today?', [
        { id: 'opt-1-1', label: 'Great' },
        { id: 'opt-1-2', label: 'Good' },
        { id: 'opt-1-3', label: 'Okay' },
        { id: 'opt-1-4', label: 'Tired' },
      ]),
      createQuestion('q-2', question2.question, question2.options),
    ],
    activeQuestionIndex: 0,
    chartType: 'bar',
  }
}
